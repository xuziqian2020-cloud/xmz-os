"use client"

import { useEffect, useRef, useState } from "react"
import { getLowConfidenceText, getOcrJobProgressText, type OcrJobProgress } from "@/lib/tools/ocr-job-status"

type OutputMode = "text" | "markdown" | "table"

type ResultFile = {
  fileName: string
  contentType: string
  fileData: string
}

type OcrJobStatus = OcrJobProgress & {
  jobId: string
  lowConfidencePages: number[]
  error?: string
  text?: string
  markdown?: string
  tableText?: string
  wordFile?: ResultFile
}

const outputModes: Array<{ key: OutputMode; label: string }> = [
  { key: "text", label: "文本" },
  { key: "markdown", label: "Markdown" },
  { key: "table", label: "表格" },
]

/** XMZADD 20260721 提供 RapidOCR 专用上传页面，使长 PDF 可显示后台进度而不受单次请求超时影响。 */
export function OcrTool() {
  const [file, setFile] = useState<File | null>(null)
  const [job, setJob] = useState<OcrJobStatus | null>(null)
  const [outputs, setOutputs] = useState<Record<OutputMode, string>>({ text: "", markdown: "", table: "" })
  const [outputMode, setOutputMode] = useState<OutputMode>("text")
  const [wordFile, setWordFile] = useState<ResultFile | null>(null)
  const [error, setError] = useState("")
  const pollingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeOutput = outputs[outputMode] || ""
  const isProcessing = job?.state === "queued" || job?.state === "running"

  useEffect(() => {
    return () => stopPolling()
  }, [])

  /** XMZADD 20260721 提交本机 OCR 任务并清空旧结果，避免用户把不同扫描件的内容混淆。 */
  async function submitJob(): Promise<void> {
    if (!file || isProcessing) return

    stopPolling()
    setError("")
    setJob(null)
    setOutputs({ text: "", markdown: "", table: "" })
    setWordFile(null)

    const formData = new FormData()
    formData.set("file", file)

    try {
      const response = await fetch("/api/tools/ocr", { method: "POST", body: formData })
      const payload = await response.json()
      if (!response.ok || !payload.jobId) {
        setError(payload.error || "OCR 任务创建失败")
        return
      }

      const created: OcrJobStatus = {
        jobId: payload.jobId,
        state: payload.state === "running" ? "running" : "queued",
        completedPages: 0,
        totalPages: null,
        lowConfidencePages: [],
      }
      setJob(created)
      await pollJob(created.jobId)
    } catch {
      setError("OCR 任务创建失败，请检查本机服务后重试")
    }
  }

  /** XMZADD 20260721 轮询本机任务状态，使用户可看到多页扫描件的真实处理进度。 */
  async function pollJob(jobId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tools/ocr/${encodeURIComponent(jobId)}`, { cache: "no-store" })
      const payload = await response.json() as OcrJobStatus
      if (!response.ok) {
        setError(payload.error || "OCR 任务状态读取失败")
        return
      }

      setJob(payload)
      if (payload.state === "completed") {
        setOutputs({
          text: payload.text || "",
          markdown: payload.markdown || payload.text || "",
          table: payload.tableText || payload.text || "",
        })
        setWordFile(payload.wordFile || null)
        return
      }

      if (payload.state === "failed") {
        setError(payload.error || "本机 RapidOCR 识别失败，请重试")
        return
      }

      pollingTimer.current = setTimeout(() => {
        void pollJob(jobId)
      }, 1000)
    } catch {
      setError("OCR 任务状态读取失败，请检查本机服务后重试")
    }
  }

  /** XMZADD 20260721 停止旧任务的页面轮询，避免重新上传后继续显示过期扫描件状态。 */
  function stopPolling(): void {
    if (!pollingTimer.current) return
    clearTimeout(pollingTimer.current)
    pollingTimer.current = null
  }

  /** XMZADD 20260721 下载当前显示模式的识别结果，支持用户按业务用途保留文本或表格。 */
  function downloadResult(): void {
    const label = outputModes.find((item) => item.key === outputMode)?.label || "结果"
    const extension = outputMode === "markdown" ? "md" : outputMode === "table" ? "tsv" : "txt"
    const contentType = outputMode === "markdown"
      ? "text/markdown;charset=utf-8"
      : outputMode === "table"
        ? "text/tab-separated-values;charset=utf-8"
        : "text/plain;charset=utf-8"
    downloadBlob(new Blob([activeOutput], { type: contentType }), `OCR识别-${label}.${extension}`)
  }

  /** XMZADD 20260721 下载可编辑 Word 结果，方便用户对低置信度内容进行线下复核。 */
  function downloadWordResult(): void {
    if (!wordFile) return
    downloadBlob(
      new Blob([base64ToArrayBuffer(wordFile.fileData)], { type: wordFile.contentType }),
      wordFile.fileName,
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">OCR 识别</h1>
        <p className="mt-2 text-base text-muted-foreground">本机 RapidOCR 离线识别，支持图片和最多 100 页的 PDF，不上传云端。</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">文件</span>
            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void submitJob()}
            disabled={!file || isProcessing}
            className="h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40"
          >
            {isProcessing ? "识别中..." : "开始识别"}
          </button>
        </div>

        {job && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {getOcrJobProgressText(job)}
          </div>
        )}
        {job && getLowConfidenceText(job.lowConfidencePages) && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {getLowConfidenceText(job.lowConfidencePages)}
          </p>
        )}
        {error && <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">结果</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border p-0.5">
              {outputModes.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOutputMode(item.key)}
                  className={`rounded px-2.5 py-1 text-sm ${outputMode === item.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {wordFile && (
              <button type="button" onClick={downloadWordResult} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                下载 Word
              </button>
            )}
            <button
              type="button"
              onClick={downloadResult}
              disabled={!activeOutput}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              下载{outputModes.find((item) => item.key === outputMode)?.label}
            </button>
          </div>
        </div>
        <textarea
          value={activeOutput}
          onChange={(event) => setOutputs((current) => ({ ...current, [outputMode]: event.target.value }))}
          placeholder="识别结果会显示在这里"
          className="min-h-[28rem] w-full resize-y bg-transparent p-5 font-mono text-sm leading-7 outline-none"
        />
      </section>
    </div>
  )
}

/** XMZADD 20260721 将后端 Word 文件的 Base64 内容还原为浏览器可下载二进制数据。 */
function base64ToArrayBuffer(value: string): ArrayBuffer {
  const binary = window.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** XMZADD 20260721 触发浏览器下载，确保 OCR 结果不会上传到任何第三方存储。 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

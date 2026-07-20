"use client"

import { useState } from "react"
import { selectBrowserAiProvider } from "@/lib/ai/local-providers"

type AiFileToolProps = {
  title: string
  desc: string
  endpoint: string
  accept: string
  outputKey: "text" | "markdown"
  downloadLabel?: string
  promptPlaceholder?: string
  modelPlaceholder?: string
  defaultModel?: string
  allowDiarize?: boolean
  allowOcrLanguage?: boolean
  outputModes?: OutputModeOption[]
}

type OutputMode = "text" | "markdown" | "table"

type OutputModeOption = {
  key: OutputMode
  label: string
}

type ResultFile = {
  fileName: string
  contentType: string
  fileData: string
}

export function AiFileTool({ title, desc, endpoint, accept, outputKey, downloadLabel, promptPlaceholder, modelPlaceholder, defaultModel = "", allowDiarize, allowOcrLanguage, outputModes }: AiFileToolProps) {
  const [file, setFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState(defaultModel)
  const [diarize, setDiarize] = useState(false)
  const defaultOutputMode = outputKey === "markdown" ? "markdown" : "text"
  const [outputMode, setOutputMode] = useState<OutputMode>(defaultOutputMode)
  const [ocrLanguage, setOcrLanguage] = useState("chi_sim+eng")
  const [outputs, setOutputs] = useState<Record<OutputMode, string>>({ text: "", markdown: "", table: "" })
  const [resultFile, setResultFile] = useState<ResultFile | null>(null)
  const [wordFile, setWordFile] = useState<ResultFile | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const activeOutput = outputs[outputMode] || ""

  async function runTool() {
    if (!file) return
    setLoading(true)
    setError("")
    setOutputs({ text: "", markdown: "", table: "" })
    setResultFile(null)
    setWordFile(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("provider", JSON.stringify(selectBrowserAiProvider()))
    if (prompt) formData.append("prompt", prompt)
    if (model.trim()) formData.append("model", model.trim())
    if (allowDiarize) formData.append("diarize", String(diarize))
    if (allowOcrLanguage) formData.append("language", ocrLanguage)

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "处理失败")
        return
      }
      if (data.fileData && data.fileName && data.contentType) {
        setResultFile({
          fileName: data.fileName,
          contentType: data.contentType,
          fileData: data.fileData,
        })
      }
      if (data.wordFile?.fileData && data.wordFile?.fileName && data.wordFile?.contentType) {
        setWordFile(data.wordFile)
      }
      setOutputs({
        text: data.text || data[outputKey] || "",
        markdown: data.markdown || data.text || "",
        table: data.tableText || data.text || "",
      })
    } catch (e: any) {
      setError(e.message || "处理失败")
    } finally {
      setLoading(false)
    }
  }

  function downloadResult() {
    if (resultFile && !outputModes) {
      downloadFile(resultFile)
      return
    }

    const label = outputModes?.find((item) => item.key === outputMode)?.label || "结果"
    const extension = outputMode === "markdown" ? "md" : outputMode === "table" ? "tsv" : "txt"
    const contentType = outputMode === "markdown"
      ? "text/markdown;charset=utf-8"
      : outputMode === "table"
        ? "text/tab-separated-values;charset=utf-8"
        : "text/plain;charset=utf-8"
    downloadBlob(new Blob([activeOutput], { type: contentType }), `${title}-${label}.${extension}`)
  }

  function downloadWordResult() {
    if (wordFile) downloadFile(wordFile)
  }

  function downloadFile(fileToDownload: ResultFile) {
    downloadBlob(
      new Blob([base64ToArrayBuffer(fileToDownload.fileData)], { type: fileToDownload.contentType }),
      fileToDownload.fileName
    )
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{desc}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">文件</span>
            <input
              type="file"
              accept={accept}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={runTool}
            disabled={!file || loading}
            className="h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "处理中..." : "开始处理"}
          </button>
        </div>

        {promptPlaceholder && (
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={promptPlaceholder}
            className="mt-4 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        )}

        {modelPlaceholder && (
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={modelPlaceholder}
            className="mt-4 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
          />
        )}

        {allowDiarize && (
          <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={diarize} onChange={(event) => setDiarize(event.target.checked)} className="h-4 w-4 rounded accent-emerald-600" />
            启用说话人区分
          </label>
        )}

        {allowOcrLanguage && (
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold">识别语言</span>
            <select
              value={ocrLanguage}
              onChange={(event) => setOcrLanguage(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
            >
              <option value="chi_sim+eng">中文 + 英文</option>
              <option value="eng">仅英文</option>
            </select>
          </label>
        )}

        {error && <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">结果</h2>
          <div className="flex flex-wrap items-center gap-2">
            {outputModes && (
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
            )}
            {wordFile && (
              <button
                type="button"
                onClick={downloadWordResult}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                下载 Word
              </button>
            )}
            <button
              type="button"
              onClick={downloadResult}
              disabled={!activeOutput && !resultFile}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              {downloadLabel || (resultFile && !outputModes ? "下载转换文件" : `下载${outputModes?.find((item) => item.key === outputMode)?.label || "Markdown"}`)}
            </button>
          </div>
        </div>
        <textarea
          value={activeOutput}
          onChange={(event) => setOutputs((prev) => ({ ...prev, [outputMode]: event.target.value }))}
          placeholder="处理结果会显示在这里"
          className="min-h-[28rem] w-full resize-y bg-transparent p-5 font-mono text-sm leading-7 outline-none"
        />
      </section>
    </div>
  )
}

function base64ToArrayBuffer(value: string): ArrayBuffer {
  const binary = window.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

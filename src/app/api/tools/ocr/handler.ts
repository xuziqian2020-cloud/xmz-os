import { NextResponse } from "next/server"
import { validateOcrFile } from "@/lib/tools/ocr-image"
import { getLocalRapidOcrJobManager, type LocalRapidOcrJobManager } from "@/lib/tools/local-rapidocr"

type OcrJobCreator = Pick<LocalRapidOcrJobManager, "createJob">

/** XMZADD 20260721 创建 OCR 提交处理器，使长扫描件立即进入本机后台队列而不占用 HTTP 请求。 */
export function createOcrPostHandler(jobManager: OcrJobCreator = getLocalRapidOcrJobManager()) {
  return async function POST(request: Request) {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "请先选择图片或 PDF 文件" }, { status: 400 })

    const validationError = validateOcrFile({ name: file.name, type: file.type, size: file.size })
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    try {
      const job = await jobManager.createJob({
        fileName: file.name,
        buffer: Buffer.from(await file.arrayBuffer()),
      })
      return NextResponse.json({ jobId: job.id, state: job.state }, { status: 202 })
    } catch {
      return NextResponse.json({ error: "本机 RapidOCR 任务创建失败，请稍后重试" }, { status: 503 })
    }
  }
}

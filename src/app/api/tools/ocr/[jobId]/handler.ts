import { NextResponse } from "next/server"
import { buildOcrResultPayload } from "@/lib/tools/ocr-output"
import { getLocalRapidOcrJobManager, type LocalRapidOcrJobManager } from "@/lib/tools/local-rapidocr"

type OcrJobReader = Pick<LocalRapidOcrJobManager, "getJob">

/** XMZADD 20260721 创建 OCR 任务状态处理器，使页面只轮询轻量状态而不重复提交扫描文件。 */
export function createOcrJobStatusHandler(jobManager: OcrJobReader = getLocalRapidOcrJobManager()) {
  return async function GET(_request: Request, context: { params: { jobId: string } }) {
    const job = jobManager.getJob(context.params.jobId)
    if (!job) return NextResponse.json({ error: "OCR 任务不存在或已过期" }, { status: 404 })

    if (job.state === "completed" && job.text) {
      const result = buildOcrResultPayload(job.fileName, job.text)
      return NextResponse.json({
        jobId: job.id,
        state: job.state,
        completedPages: job.completedPages,
        totalPages: job.totalPages,
        lowConfidencePages: job.lowConfidencePages,
        ...result,
      })
    }

    return NextResponse.json({
      jobId: job.id,
      state: job.state,
      completedPages: job.completedPages,
      totalPages: job.totalPages,
      lowConfidencePages: job.lowConfidencePages,
      ...(job.state === "failed" ? { error: job.error || "本机 RapidOCR 识别失败，请重试" } : {}),
    })
  }
}

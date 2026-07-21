export type OcrJobProgress = {
  state: "queued" | "running" | "completed" | "failed"
  completedPages: number
  totalPages: number | null
}

/** XMZADD 20260721 将后台任务状态转换为上传页面的简短进度文案，降低长 PDF 等待焦虑。 */
export function getOcrJobProgressText(job: OcrJobProgress): string {
  if (job.state === "queued") return "任务排队中"
  if (job.state === "running" && job.totalPages) return `正在识别第 ${job.completedPages} / ${job.totalPages} 页`
  if (job.state === "running") return "正在准备识别"
  if (job.state === "completed") return "识别完成"
  return "识别失败"
}

/** XMZADD 20260721 生成人工复核提示，帮助用户优先检查 RapidOCR 置信度不足的页面。 */
export function getLowConfidenceText(pageNumbers: number[]): string {
  const uniquePages = Array.from(new Set(pageNumbers.filter((pageNumber) => Number.isInteger(pageNumber) && pageNumber > 0))).sort((left, right) => left - right)
  if (uniquePages.length === 0) return ""
  return `第 ${uniquePages.join("、")} 页置信度较低，建议核对原件`
}

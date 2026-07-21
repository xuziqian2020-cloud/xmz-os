export type ImageFileLike = {
  name?: string | null
  type?: string | null
  size?: number | null
}

/** XMZADD 20260721 统一定义本机 RapidOCR 的 PDF 页数边界，避免长扫描件耗尽本机资源。 */
export const RAPID_OCR_MAX_PDF_PAGES = 100

const imageExtensions = new Set([
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
])

/** XMZADD 20260720 判断常见图片格式是否可交给 OCR 识别。 */
export function isSupportedImageFile(file: ImageFileLike): boolean {
  const type = (file.type || "").toLowerCase()
  const extension = getFileExtension(file.name || "")

  if (type.startsWith("image/")) return true
  if (!imageExtensions.has(extension)) return false
  if (!type || type === "application/octet-stream") return true
  return false
}

/** XMZADD 20260721 判断图片或 PDF 是否可提交给本机 RapidOCR 后台队列。 */
export function isSupportedOcrFile(file: ImageFileLike): boolean {
  const type = (file.type || "").toLowerCase()
  if (isSupportedImageFile(file) || type === "application/pdf") return true
  return getFileExtension(file.name || "") === "pdf" && (!type || type === "application/octet-stream")
}

/** XMZADD 20260721 在任务创建前拦截过大文件，保证本机 OCR 队列不会被单一上传占满磁盘。 */
export function validateOcrFile(file: ImageFileLike): string | null {
  if (!isSupportedOcrFile(file)) return "请上传图片或 PDF 文件"

  const type = (file.type || "").toLowerCase()
  const isPdf = type === "application/pdf" || getFileExtension(file.name || "") === "pdf"
  const maxSize = isPdf ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  if (Number(file.size || 0) > maxSize) return isPdf ? "PDF 文件不能超过 50MB" : "图片文件不能超过 10MB"
  return null
}

/** XMZADD 20260720 读取用户文件扩展名，用于兼容浏览器未提供 MIME 类型的上传场景。 */
function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : ""
}

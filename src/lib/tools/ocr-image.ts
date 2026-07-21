export type ImageFileLike = {
  name?: string | null
  type?: string | null
  size?: number | null
}

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

export function isSupportedImageFile(file: ImageFileLike): boolean {
  const type = (file.type || "").toLowerCase()
  const extension = getFileExtension(file.name || "")

  if (type.startsWith("image/")) return true
  if (!imageExtensions.has(extension)) return false
  if (!type || type === "application/octet-stream") return true
  return false
}

/** XMZADD 20260720 判断文件是否可提交给百度 Unlimited-OCR 进行文档识别。 */
export function isSupportedOcrFile(file: ImageFileLike): boolean {
  const type = (file.type || "").toLowerCase()
  if (isSupportedImageFile(file) || type === "application/pdf") return true
  return getFileExtension(file.name || "") === "pdf" && (!type || type === "application/octet-stream")
}

/** XMZADD 20260720 在上传前按百度 Unlimited-OCR 的文件大小限制拦截无效请求。 */
export function validateOcrFile(file: ImageFileLike): string | null {
  if (!isSupportedOcrFile(file)) return "请上传图片或 PDF 文件"

  const type = (file.type || "").toLowerCase()
  const isPdf = type === "application/pdf" || getFileExtension(file.name || "") === "pdf"
  const maxSize = isPdf ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  if (Number(file.size || 0) > maxSize) return isPdf ? "PDF 文件不能超过 50MB" : "图片文件不能超过 10MB"
  return null
}

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : ""
}

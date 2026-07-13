export type ImageFileLike = {
  name?: string | null
  type?: string | null
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

export function getOcrLanguage(value: FormDataEntryValue | string | null): string {
  const language = typeof value === "string" ? value : ""
  return language === "eng" ? "eng" : "chi_sim+eng"
}

export async function normalizeImageForOcr(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default
  const image = sharp(buffer, { animated: false, limitInputPixels: false }).rotate().flatten({ background: "#ffffff" })
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const targetWidth = width > 0 && width < 1600 ? 1600 : width > 2600 ? 2600 : undefined

  let pipeline = image.grayscale().normalize().sharpen()
  if (targetWidth) {
    pipeline = pipeline.resize({ width: targetWidth, fit: "inside", withoutEnlargement: false })
  }

  return pipeline.png().toBuffer()
}

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : ""
}

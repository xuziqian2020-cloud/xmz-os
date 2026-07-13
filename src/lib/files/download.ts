type StoredFileLike = {
  file_name?: string | null
  file_type?: string | null
  storage_path?: string | null
}

export type StoredFileDownload =
  | { kind: "inline"; bytes: Uint8Array; contentType: string; fileName: string }
  | { kind: "remote"; url: string; contentType: string; fileName: string }
  | { kind: "missing" }

export function resolveStoredFileDownload(file: StoredFileLike): StoredFileDownload {
  const storagePath = file.storage_path || ""
  const fileName = file.file_name || "download"

  if (!storagePath) return { kind: "missing" }

  if (storagePath.startsWith("data:")) {
    return parseDataUrl(storagePath, fileName)
  }

  if (/^https?:\/\//i.test(storagePath)) {
    return {
      kind: "remote",
      url: storagePath,
      fileName,
      contentType: inferContentType(file.file_type, fileName),
    }
  }

  return { kind: "missing" }
}

export function buildContentDisposition(fileName: string): string {
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

function parseDataUrl(storagePath: string, fileName: string): StoredFileDownload {
  const match = storagePath.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if (!match) return { kind: "missing" }

  const contentType = match[1] || inferContentType(null, fileName)
  const payload = decodeURIComponent(match[3] || "")
  const bytes = match[2]
    ? Uint8Array.from(Buffer.from(payload, "base64"))
    : new TextEncoder().encode(payload)

  return {
    kind: "inline",
    bytes,
    contentType,
    fileName,
  }
}

function inferContentType(fileType?: string | null, fileName = ""): string {
  const normalized = (fileType || "").toLowerCase()
  if (normalized.includes("/")) return normalized
  if (normalized === "pdf" || fileName.toLowerCase().endsWith(".pdf")) return "application/pdf"
  if (normalized === "png" || normalized === "jpg" || normalized === "jpeg" || normalized === "webp") return `image/${normalized === "jpg" ? "jpeg" : normalized}`
  if (normalized === "plain" || normalized === "txt" || fileName.toLowerCase().endsWith(".txt")) return "text/plain"
  return "application/octet-stream"
}

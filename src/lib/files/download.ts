type StoredFileLike = {
  file_name?: string | null
  file_type?: string | null
  storage_path?: string | null
}

export type StoredFileDownload =
  | { kind: "inline"; bytes: Uint8Array; contentType: string; fileName: string }
  | { kind: "remote"; url: string; contentType: string; fileName: string }
  | { kind: "local"; storagePath: string; contentType: string; fileName: string }
  | { kind: "missing" }

export function resolveStoredFileDownload(file: StoredFileLike): StoredFileDownload {
  const storagePath = file.storage_path || ""
  const fileName = file.file_name || "download"

  if (!storagePath) return { kind: "missing" }

  if (storagePath.startsWith("data:")) {
    return parseDataUrl(storagePath, fileName)
  }

  if (storagePath.startsWith("local:")) {
    return {
      kind: "local",
      storagePath,
      fileName,
      contentType: inferContentType(file.file_type, fileName),
    }
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

export function buildContentDisposition(fileName: string, inline = false): string {
  return `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

function parseDataUrl(storagePath: string, fileName: string): StoredFileDownload {
  const match = storagePath.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if (!match) return { kind: "missing" }

  const contentType = normalizePreviewContentType(match[1] || inferContentType(null, fileName), fileName)
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
  if (normalized === "plain" || normalized === "txt" || fileName.toLowerCase().endsWith(".txt")) return "text/plain; charset=utf-8"
  if (normalized === "md" || normalized === "markdown" || fileName.toLowerCase().endsWith(".md")) return "text/plain; charset=utf-8"
  if (normalized === "csv" || fileName.toLowerCase().endsWith(".csv")) return "text/csv; charset=utf-8"
  if (normalized === "json" || fileName.toLowerCase().endsWith(".json")) return "application/json"
  if (normalized === "log" || fileName.toLowerCase().endsWith(".log")) return "text/plain; charset=utf-8"
  return "application/octet-stream"
}

function normalizePreviewContentType(contentType: string, fileName: string): string {
  const normalized = contentType.toLowerCase()
  if (normalized.startsWith("text/markdown") || fileName.toLowerCase().endsWith(".md")) return "text/plain; charset=utf-8"
  if (normalized === "text/plain") return "text/plain; charset=utf-8"
  return contentType
}

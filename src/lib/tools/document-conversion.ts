export function buildWordHtmlDocument(title: string, text: string): string {
  const safeTitle = escapeHtml(title || "转换文档")
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)

  const body = paragraphs.length === 0
    ? "<p>暂无可识别文本。</p>"
    : paragraphs.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n")

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>
    body { font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; color: #111827; line-height: 1.8; padding: 36px 48px; }
    h1 { font-size: 24px; text-align: center; margin: 0 0 24px; }
    p { font-size: 14px; margin: 8px 0; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${body}
</body>
</html>`
}

export function buildWordFileName(fileName: string): string {
  return `${getKnowledgeFileTitle(fileName) || "转换文档"}.doc`
}

export function buildPdfFileName(fileName: string): string {
  return `${getKnowledgeFileTitle(fileName) || "转换文档"}.pdf`
}

export function getKnowledgeFileTitle(fileName: string): string {
  const normalized = (fileName || "").trim()
  if (!normalized) return ""
  return normalized.replace(/\.[^.\\/]+$/i, "")
}

export function isTextLikeFile(fileName: string, contentType?: string | null): boolean {
  const type = (contentType || "").toLowerCase()
  const extension = getExtension(fileName)

  if (type.startsWith("text/")) return true
  if (type.includes("json") || type.includes("xml") || type.includes("csv") || type.includes("javascript")) return true

  return new Set([
    "csv",
    "css",
    "html",
    "js",
    "json",
    "log",
    "md",
    "markdown",
    "sql",
    "ts",
    "tsx",
    "txt",
    "xml",
    "yaml",
    "yml",
  ]).has(extension)
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : ""
}

export function plainTextToMarkdown(text: string, title = "转换文档"): string {
  const normalized = text.replace(/\r\n/g, "\n").trim()
  if (!normalized) return `# ${title}\n\n暂无可识别文本。`

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean)
  return [`# ${title}`, "", ...lines.map((line) => (/^[-*#]/.test(line) ? line : line.length <= 32 ? `## ${line}` : line))].join("\n")
}

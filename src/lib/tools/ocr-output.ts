import { buildWordFileName, buildWordHtmlDocument, getKnowledgeFileTitle } from "./document-conversion"
import { plainTextToMarkdown } from "./markdown"

export type OcrResultPayload = {
  text: string
  markdown: string
  tableText: string
  wordFile: {
    fileName: string
    contentType: string
    fileData: string
  }
}

/** XMZADD 20260720 将 Unlimited-OCR 返回的 Markdown 组装为页面现有的下载结果。 */
export function buildOcrResultPayload(fileName: string, markdown: string): OcrResultPayload {
  const title = getKnowledgeFileTitle(fileName) || "OCR识别结果"
  const normalizedMarkdown = normalizeOcrText(markdown)
  const text = extractPlainTextFromMarkdown(normalizedMarkdown)
  const wordHtml = buildWordHtmlDocument(title, text)

  return {
    text,
    markdown: hasMarkdownSyntax(normalizedMarkdown) ? normalizedMarkdown : plainTextToMarkdown(text, title),
    tableText: plainTextToTable(text),
    wordFile: {
      fileName: buildWordFileName(fileName || "OCR识别结果.png"),
      contentType: "application/msword;charset=utf-8",
      fileData: Buffer.from(wordHtml, "utf8").toString("base64"),
    },
  }
}

/** XMZADD 20260720 将 Markdown 与 HTML 表格识别结果转换为可复制的纯文本。 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  let prepared = normalizeOcrText(markdown)

  if (/<table\b/i.test(prepared)) {
    prepared = prepared
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<(?:td|th)[^>]*>/gi, "\t")
      .replace(/<\/(?:td|th)>/gi, "")
      .replace(/<\/?(?:table|thead|tbody)[^>]*>/gi, "")
      .replace(/<tr[^>]*>/gi, "")
  }

  prepared = prepared.replace(/^\s{0,3}#{1,6}\s+/gm, "")

  const lines: string[] = []
  for (const line of prepared.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || isMarkdownTableSeparator(trimmed)) continue
    if (isMarkdownTableRow(trimmed)) {
      lines.push(trimmed.slice(1, -1).split("|").map((cell) => cell.trim()).join("\t"))
    } else {
      lines.push(trimmed)
    }
  }
  return lines.join("\n")
}

export function plainTextToTable(text: string): string {
  const lines = normalizeOcrText(text).split("\n")
  const tableLines: string[] = []
  let hasColumns = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const columns = trimmed.split(/\s+/).filter(Boolean)
    if (columns.length > 1) {
      hasColumns = true
      tableLines.push(columns.join("\t"))
    } else {
      tableLines.push(trimmed)
    }
  }

  return hasColumns ? tableLines.join("\n") : lines.map((line) => line.trim()).filter(Boolean).join("\n")
}

function normalizeOcrText(text: string): string {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .trim()
}

function hasMarkdownSyntax(text: string): boolean {
  return /(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s*\|.*\||<\s*(?:table|tr|td|th)\b|(^|\n)\s*(?:[-*+]\s+|\d+\.\s+|>\s)|`{1,3}|\*\*|__|\[[^\]]+\]\([^)]*\)/i.test(text)
}

function isMarkdownTableRow(text: string): boolean {
  return text.startsWith("|") && text.endsWith("|")
}

function isMarkdownTableSeparator(text: string): boolean {
  return isMarkdownTableRow(text) && /^[|\s:-]+$/.test(text)
}

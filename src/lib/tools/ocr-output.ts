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

export function buildOcrResultPayload(fileName: string, text: string): OcrResultPayload {
  const title = getKnowledgeFileTitle(fileName) || "OCR识别结果"
  const normalizedText = normalizeOcrText(text)
  const wordHtml = buildWordHtmlDocument(title, normalizedText)

  return {
    text: normalizedText,
    markdown: plainTextToMarkdown(normalizedText, title),
    tableText: plainTextToTable(normalizedText),
    wordFile: {
      fileName: buildWordFileName(fileName || "OCR识别结果.png"),
      contentType: "application/msword;charset=utf-8",
      fileData: Buffer.from(wordHtml, "utf8").toString("base64"),
    },
  }
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

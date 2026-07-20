import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import mammoth from "mammoth"
import { isSupportedImageFile } from "@/lib/tools/ocr-image"
import { extractPlainTextFromMarkdown } from "@/lib/tools/ocr-output"
import { recognizeUnlimitedOcrFile } from "@/lib/tools/unlimited-ocr"
import { getKnowledgeFileTitle, isTextLikeFile } from "@/lib/tools/document-conversion"

export const runtime = "nodejs"
const require = createRequire(import.meta.url)

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择文件" }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const extracted = await extractFileText(file, buffer)
    return NextResponse.json({
      title: getKnowledgeFileTitle(file.name) || file.name || "未命名资料",
      source: file.name,
      content: extracted,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "文件解析失败" }, { status: 500 })
  }
}

async function extractFileText(file: File, buffer: Buffer): Promise<string> {
  const name = file.name || "未命名文件"
  const lowerName = name.toLowerCase()

  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const pdfParse = require("pdf-parse/lib/pdf-parse.js")
      const data = await pdfParse(buffer)
      return String(data.text || "").trim() || buildFallbackContent(file, "PDF 中没有抽取到可复制文本")
    } catch {
      return buildFallbackContent(file, "PDF 解析失败，系统已先保存资料元信息")
    }
  }

  if (lowerName.endsWith(".docx")) {
    // 非标准 docx 不是 Office Open XML 压缩包，不能交给 mammoth 强行解析。
    if (!isZipBuffer(buffer)) {
      return buildFallbackContent(file, "这个 Word 文件不是标准 docx 压缩包，系统已先保存资料元信息")
    }

    try {
      const result = await mammoth.extractRawText({ buffer })
      return String(result.value || "").trim() || buildFallbackContent(file, "Word 中没有抽取到正文")
    } catch {
      return buildFallbackContent(file, "Word 正文解析失败，系统已先保存资料元信息")
    }
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    try {
      const xlsx = require("xlsx")
      const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true })
      const sections: string[] = []
      for (const sheetName of workbook.SheetNames) {
        const csv = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName])
        if (csv.trim()) sections.push(`## ${sheetName}\n\n${csv.trim()}`)
      }
      return sections.join("\n\n") || buildFallbackContent(file, "表格中没有抽取到数据")
    } catch {
      return buildFallbackContent(file, "表格解析失败，系统已先保存资料元信息")
    }
  }

  if (isSupportedImageFile({ name, type: file.type })) {
    try {
      const markdown = await recognizeUnlimitedOcrFile({ fileName: name, buffer })
      const text = extractPlainTextFromMarkdown(markdown)
      return text || buildFallbackContent(file, "图片中没有识别到文字")
    } catch {
      return buildFallbackContent(file, "图片 OCR 失败，系统已先保存资料元信息")
    }
  }

  if (isTextLikeFile(name, file.type)) {
    return buffer.toString("utf8").trim() || buildFallbackContent(file, "文本文件为空")
  }

  return buildFallbackContent(file, "当前格式已收录为资料元信息，暂时没有可抽取正文")
}

function buildFallbackContent(file: File, reason: string): string {
  return [
    `# ${getKnowledgeFileTitle(file.name) || file.name || "未命名资料"}`,
    "",
    `- 文件名：${file.name || "未命名"}`,
    `- 文件类型：${file.type || "未知"}`,
    `- 文件大小：${formatSize(file.size || 0)}`,
    `- 处理结果：${reason}`,
  ].join("\n")
}

function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import mammoth from "mammoth"
import { isSupportedImageFile } from "@/lib/tools/ocr-image"
import { extractPlainTextFromMarkdown } from "@/lib/tools/ocr-output"
import { LocalOcrError, recognizeLocalOcrFile } from "@/lib/tools/local-paddle-ocr"
import { getKnowledgeFileTitle, isTextLikeFile } from "@/lib/tools/document-conversion"

const require = createRequire(import.meta.url)
type LocalOcrRecognizer = typeof recognizeLocalOcrFile

/** XMZADD 20260721 创建资料提取路由处理器，便于在不改变线上默认本机识别器的前提下验证错误返回。*/
export function createExtractDocumentPostHandler(recognizeFile = recognizeLocalOcrFile) {
  return async function POST(request: Request) {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "请先选择文件" }, { status: 400 })

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const extracted = await extractFileText(file, buffer, recognizeFile)
      return NextResponse.json({
        title: getKnowledgeFileTitle(file.name) || file.name || "未命名资料",
        source: file.name,
        content: extracted,
      })
    } catch (error: unknown) {
      if (error instanceof LocalOcrError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: "文件解析失败" }, { status: 500 })
    }
  }
}

/** XMZADD 20260721 按文件格式提取知识库正文，并在扫描件缺少文本层时调用本机 PaddleOCR。*/
async function extractFileText(
  file: File,
  buffer: Buffer,
  recognizeLocalOcrFile: LocalOcrRecognizer,
): Promise<string> {
  const name = file.name || "未命名文件"
  const lowerName = name.toLowerCase()

  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const pdfParse = require("pdf-parse/lib/pdf-parse.js")
      const data = await pdfParse(buffer)
      const text = String(data.text || "").trim()
      if (text) return text
    } catch {
      return buildFallbackContent(file, "PDF 解析失败，系统已先保存资料元信息")
    }

    // 扫描件 PDF 没有可复制文本层时，才使用本机 OCR 补齐知识库正文。
    const ocrText = await recognizeLocalOcrFile({ fileName: name, buffer })
    const text = extractPlainTextFromMarkdown(ocrText)
    return text || buildFallbackContent(file, "PDF 中没有识别到文字")
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
      const ocrText = await recognizeLocalOcrFile({ fileName: name, buffer })
      const text = extractPlainTextFromMarkdown(ocrText)
      return text || buildFallbackContent(file, "图片中没有识别到文字")
    } catch (error: unknown) {
      if (error instanceof LocalOcrError) throw error
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

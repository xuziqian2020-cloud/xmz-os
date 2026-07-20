import { existsSync } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"
import mammoth from "mammoth"
import { buildPdfFileName } from "@/lib/tools/document-conversion"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择 Word 文件" }, { status: 400 })
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "当前支持 .docx 转 PDF，请先把 .doc 另存为 .docx 后再转换" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = String(result.value || "").trim()
    const pdf = await buildPdfBuffer(file.name.replace(/\.docx$/i, ""), text)

    return NextResponse.json({
      text,
      fileName: buildPdfFileName(file.name),
      contentType: "application/pdf",
      fileData: pdf.toString("base64"),
    })
  } catch (e: any) {
    const message = String(e.message || "")
    if (message.includes("central directory") || message.includes("zip")) {
      return NextResponse.json({ error: "当前支持真实 .docx 文件，请确认不是 .doc、损坏文件或改后缀文件" }, { status: 400 })
    }
    return NextResponse.json({ error: message || "Word 转 PDF 失败" }, { status: 500 })
  }
}

async function buildPdfBuffer(title: string, text: string): Promise<Buffer> {
  const PDFDocument = loadPdfKit()
  const fontPath = getChineseFontPath()
  if (!fontPath) {
    throw new Error("未找到可用的 TTF 中文字体，无法生成 PDF。请确认系统存在 simhei.ttf 或在 public/fonts 放入 NotoSansSC-Regular.otf。")
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, info: { Title: title || "转换文档" } })
    const chunks: Buffer[] = []

    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("error", reject)
    doc.on("end", () => resolve(Buffer.concat(chunks)))

    doc.registerFont("xmz-cn", fontPath)
    doc.addPage({ size: "A4", margin: 56 })
    doc.font("xmz-cn")
    doc.fontSize(18).text(title || "转换文档", { align: "center" })
    doc.moveDown()
    doc.fontSize(11)

    const lines = text.replace(/\r\n/g, "\n").split("\n")
    if (lines.every((line) => !line.trim())) {
      doc.text("暂无可识别文本。", { lineGap: 6 })
    } else {
      for (const line of lines) {
        doc.text(line.trim() || " ", { lineGap: 6 })
      }
    }

    doc.end()
  })
}

function loadPdfKit() {
  const nodeRequire = eval("require") as (id: string) => any
  return nodeRequire(path.join(process.cwd(), "node_modules", "pdfkit", "js", "pdfkit.js"))
}

function getChineseFontPath(): string {
  const candidates = [
    "C:\\Windows\\Fonts\\simhei.ttf",
    "C:\\Windows\\Fonts\\simkai.ttf",
    path.join(process.cwd(), "public", "fonts", "NotoSansSC-Regular.otf"),
    "C:\\Windows\\Fonts\\Noto Sans SC (TrueType).otf",
    "C:\\Windows\\Fonts\\msyh.ttc",
  ]

  for (const candidate of candidates) {
    if (!/\.(ttf|otf)$/i.test(candidate)) continue
    if (existsSync(candidate)) return candidate
  }
  return ""
}

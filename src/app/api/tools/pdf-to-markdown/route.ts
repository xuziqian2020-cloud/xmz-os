import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import { plainTextToMarkdown } from "@/lib/tools/markdown"

export const runtime = "nodejs"
const require = createRequire(import.meta.url)

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择 PDF 文件" }, { status: 400 })
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return NextResponse.json({ error: "请上传 PDF 文件" }, { status: 400 })
  }

  try {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js")
    const data = await pdfParse(Buffer.from(await file.arrayBuffer()))
    const markdown = plainTextToMarkdown(data.text || "", file.name.replace(/\.pdf$/i, ""))
    return NextResponse.json({ markdown, text: data.text || "" })
  } catch (e: any) {
    const message = String(e.message || "")
    if (/Invalid PDF|bad XRef|not a PDF|PDF structure/i.test(message)) {
      return NextResponse.json({ error: "PDF 无法解析，请确认文件没有损坏、未加密且是真实 PDF" }, { status: 400 })
    }
    return NextResponse.json({ error: message || "PDF 转换失败，请确认文件未加密且可以复制文本" }, { status: 500 })
  }
}

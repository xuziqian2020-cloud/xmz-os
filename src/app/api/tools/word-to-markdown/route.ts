import { NextResponse } from "next/server"
import mammoth from "mammoth"
import { plainTextToMarkdown } from "@/lib/tools/markdown"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择 Word 文件" }, { status: 400 })
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "当前仅支持 .docx 文件，请先把 .doc 另存为 .docx 后再转换" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const markdown = plainTextToMarkdown(result.value || "", file.name.replace(/\.docx$/i, ""))
    return NextResponse.json({ markdown, text: result.value || "", messages: result.messages || [] })
  } catch (e: any) {
    const message = String(e.message || "")
    if (message.includes("central directory") || message.includes("zip")) {
      return NextResponse.json({ error: "当前仅支持真实 .docx 文件，请确认不是 .doc、损坏文件或改后缀文件" }, { status: 400 })
    }
    return NextResponse.json({ error: message || "Word 转换失败" }, { status: 500 })
  }
}

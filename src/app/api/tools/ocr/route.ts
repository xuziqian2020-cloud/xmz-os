import { NextResponse } from "next/server"
import { getOcrLanguage, isSupportedImageFile } from "@/lib/tools/ocr-image"
import { buildOcrResultPayload } from "@/lib/tools/ocr-output"
import { recognizeImageText } from "@/lib/tools/ocr-recognize"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const language = getOcrLanguage(formData.get("language"))
  if (!file) return NextResponse.json({ error: "请先选择图片" }, { status: 400 })

  if (!isSupportedImageFile({ name: file.name, type: file.type })) {
    return NextResponse.json({ error: "请上传图片文件，支持 PNG、JPG、WEBP、GIF、BMP、TIFF、HEIC、AVIF、SVG 等常见格式。" }, { status: 400 })
  }

  try {
    const text = await recognizeImageText(Buffer.from(await file.arrayBuffer()), language)
    if (!text.trim()) return NextResponse.json({ error: "没有识别到文字，请换一张更清晰的图片" }, { status: 422 })
    return NextResponse.json(buildOcrResultPayload(file.name, text))
  } catch (e: any) {
    const message = String(e.message || "")
    if (message.includes("read image") || message.includes("pixRead") || message.includes("Input buffer") || message.includes("unsupported image")) {
      return NextResponse.json({ error: "图片无法读取，请确认文件没有损坏且格式正确" }, { status: 400 })
    }
    return NextResponse.json({ error: message || "OCR 识别失败，请确认图片清晰且格式正确" }, { status: 500 })
  }
}

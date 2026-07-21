import { NextResponse } from "next/server"
import { validateOcrFile } from "@/lib/tools/ocr-image"
import { buildOcrResultPayload } from "@/lib/tools/ocr-output"
import { LocalOcrError, recognizeLocalOcrFile } from "@/lib/tools/local-paddle-ocr"

export const runtime = "nodejs"

/** XMZADD 20260721 接收图片或 PDF 并调用本机 PaddleOCR 返回页面下载所需的识别结果。 */
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择图片或 PDF 文件" }, { status: 400 })

  const validationError = validateOcrFile({ name: file.name, type: file.type, size: file.size })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  try {
    const text = await recognizeLocalOcrFile({
      fileName: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
    })
    const result = buildOcrResultPayload(file.name, text)
    if (!result.text.trim()) return NextResponse.json({ error: "没有识别到文字，请换一张更清晰的图片" }, { status: 422 })
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof LocalOcrError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: "本机 OCR 识别失败，请检查本机运行环境" }, { status: 502 })
  }
}

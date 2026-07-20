import { NextResponse } from "next/server"
import { validateOcrFile } from "@/lib/tools/ocr-image"
import { buildOcrResultPayload } from "@/lib/tools/ocr-output"
import { recognizeUnlimitedOcrFile, UnlimitedOcrError } from "@/lib/tools/unlimited-ocr"

export const runtime = "nodejs"

/** XMZADD 20260720 接收图片或 PDF 并调用百度 Unlimited-OCR 返回页面下载所需的识别结果。 */
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择图片或 PDF 文件" }, { status: 400 })

  const validationError = validateOcrFile({ name: file.name, type: file.type, size: file.size })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  try {
    const markdown = await recognizeUnlimitedOcrFile({
      fileName: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
    })
    const result = buildOcrResultPayload(file.name, markdown)
    if (!result.text.trim()) return NextResponse.json({ error: "没有识别到文字，请换一张更清晰的图片" }, { status: 422 })
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof UnlimitedOcrError) {
      const message = error.statusCode === 503
        ? "尚未配置百度 Unlimited-OCR 凭据"
        : error.statusCode === 504
          ? "OCR 识别任务超时，请稍后重试"
          : "OCR 识别失败，请稍后重试"
      return NextResponse.json({ error: message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: "OCR 识别失败，请稍后重试" }, { status: 500 })
  }
}

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("本地 AI 工具回归", () => {
  it("OCR 使用本地识别兜底，避免把 image_url 发给纯文本模型", () => {
    const route = source("../../app/api/tools/ocr/route.ts")
    const recognizer = source("./ocr-recognize.ts")

    assert.match(recognizer, /tesseract\.js/)
    assert.match(route, /recognizeImageText/)
    assert.equal(route.includes("image_url"), false)
  })

  it("PDF 转 Markdown 绕过 pdf-parse 测试入口", () => {
    const route = source("../../app/api/tools/pdf-to-markdown/route.ts")

    assert.match(route, /pdf-parse\/lib\/pdf-parse\.js/)
    assert.equal(route.includes('import("pdf-parse")'), false)
  })

  it("Word 转 Markdown 明确只接受 docx", () => {
    const route = source("../../app/api/tools/word-to-markdown/route.ts")

    assert.match(route, /\.docx/)
    assert.match(route, /当前仅支持/)
  })

  it("音频转文字会校验供应商是否支持转写接口", () => {
    const route = source("../../app/api/tools/transcribe/route.ts")

    assert.match(route, /supportsAudioTranscription/)
    assert.match(route, /whisper-1/)
  })

  it("会议纪要页面提供浏览器实时语音识别兜底", () => {
    const page = source("../../app/tools/meeting-minutes/page.tsx")

    assert.match(page, /SpeechRecognition/)
    assert.match(page, /实时转写/)
  })
})

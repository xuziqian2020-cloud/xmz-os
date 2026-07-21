import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("本地 AI 工具回归", () => {
  it("业务 OCR 路由使用本机 PaddleOCR，不访问百度云端", () => {
    const route = source("../../app/api/tools/ocr/route.ts")
    const extractRoute = source("../../app/api/tools/extract-document/route.ts")
    const page = source("../../app/tools/ocr/page.tsx")

    assert.match(route, /recognizeLocalOcrFile/)
    assert.match(extractRoute, /recognizeLocalOcrFile/)
    assert.equal(route.includes("recognizeUnlimitedOcrFile"), false)
    assert.equal(extractRoute.includes("recognizeUnlimitedOcrFile"), false)
    assert.equal(route.includes("aip.baidubce.com"), false)
    assert.equal(extractRoute.includes("aip.baidubce.com"), false)
    assert.match(page, /本机 PaddleOCR/)
    assert.match(route, /error instanceof LocalOcrError/)
    assert.match(extractRoute, /const data = await pdfParse\(buffer\)/)
    assert.match(extractRoute, /const ocrText = await recognizeLocalOcrFile/)
    assert.match(extractRoute, /error instanceof LocalOcrError/)
    assert.match(page, /application\/pdf/)
    assert.equal(route.includes("recognizeImageText"), false)
    assert.equal(extractRoute.includes("recognizeImageText"), false)
    assert.match(route, /error instanceof LocalOcrError[\s\S]*error: error\.message/)
    assert.equal(route.includes("image_url"), false)
  })

  it("Unlimited-OCR 上线后移除本地 OCR 依赖", () => {
    const packageJson = source("../../../package.json")

    assert.equal(packageJson.includes('"tesseract.js"'), false)
    assert.equal(packageJson.includes('"sharp"'), false)
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

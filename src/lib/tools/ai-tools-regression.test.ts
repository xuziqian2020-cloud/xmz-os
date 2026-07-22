import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("本地 AI 工具回归", () => {
  it("OCR 工具页使用本机 RapidOCR 队列，不访问百度云端", () => {
    const route = source("../../app/api/tools/ocr/route.ts")
    const handler = source("../../app/api/tools/ocr/handler.ts")
    const statusRoute = source("../../app/api/tools/ocr/[jobId]/route.ts")
    const statusHandler = source("../../app/api/tools/ocr/[jobId]/handler.ts")
    const page = source("../../app/tools/ocr/page.tsx")
    const component = source("../../components/tools/ocr-tool.tsx")
    const inputRules = source("./ocr-image.ts")
    const extractRoute = source("../../app/api/tools/extract-document/route.ts")
    const extractHandler = source("../../app/api/tools/extract-document/handler.ts")

    assert.match(route, /createOcrPostHandler/)
    assert.match(handler, /getLocalRapidOcrJobManager/)
    assert.match(statusRoute, /createOcrJobStatusHandler/)
    assert.match(statusHandler, /buildOcrResultPayload/)
    assert.match(page, /OcrTool/)
    assert.match(component, /本机 RapidOCR/)
    assert.match(inputRules, /export const RAPID_OCR_MAX_PDF_PAGES = 100/)
    assert.equal(handler.includes("recognizeUnlimitedOcrFile"), false)
    assert.equal(statusHandler.includes("recognizeUnlimitedOcrFile"), false)
    assert.equal(handler.includes("recognizeLocalOcrFile"), false)
    assert.equal(handler.includes("aip.baidubce.com"), false)
    assert.equal(statusHandler.includes("aip.baidubce.com"), false)

    assert.match(extractRoute, /createExtractDocumentPostHandler/)
    assert.match(extractHandler, /const ocrText = await recognizeLocalOcrFile/)
    assert.equal(extractHandler.includes("recognizeUnlimitedOcrFile"), false)
  })

  it("RapidOCR 改造后仍不恢复已移除的 Tesseract 依赖", () => {
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
  })

  it("音频转文字会校验供应商是否支持转写接口", () => {
    const route = source("../../app/api/tools/transcribe/route.ts")

    assert.match(route, /supportsAudioTranscription/)
    assert.match(route, /sensevoice/)
  })

  it("会议纪要页面提供浏览器实时语音识别兜底", () => {
    const page = source("../../app/tools/meeting-minutes/page.tsx")

    assert.match(page, /SpeechRecognition/)
    assert.match(page, /实时转写/)
  })
})

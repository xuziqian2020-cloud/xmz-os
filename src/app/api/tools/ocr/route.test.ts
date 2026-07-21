import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { LocalOcrError } from "@/lib/tools/local-paddle-ocr"
import { createOcrPostHandler } from "./handler"

/** XMZADD 20260721 构造图片上传请求，确保测试经过真实 OCR 路由处理流程。 */
function createImageRequest(): Request {
  const formData = new FormData()
  formData.set("file", new File([Buffer.from("image")], "scan.png", { type: "image/png" }))
  return new Request("http://localhost/api/tools/ocr", { method: "POST", body: formData })
}

describe("OCR 路由本机错误返回", () => {
  for (const expected of [
    { statusCode: 503, message: "本机 OCR 尚未安装，请先执行本机 OCR 安装" },
    { statusCode: 422, message: "没有识别到文字，请换一份更清晰的扫描件" },
    { statusCode: 502, message: "本机 OCR 识别失败，请检查本机运行环境" },
  ]) {
    it(`原样返回本机 OCR 的 ${expected.statusCode} 错误`, async () => {
      let recognizeCallCount = 0
      const post = createOcrPostHandler(async () => {
        recognizeCallCount += 1
        throw new LocalOcrError(expected.message, expected.statusCode)
      })

      const response = await post(createImageRequest())

      assert.equal(response.status, expected.statusCode)
      assert.deepEqual(await response.json(), { error: expected.message })
      assert.equal(recognizeCallCount, 1)
    })
  }
})

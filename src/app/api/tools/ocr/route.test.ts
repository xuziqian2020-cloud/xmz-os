import assert from "node:assert/strict"
import { before, describe, it, mock } from "node:test"

/** XMZADD 20260721 模拟本机 OCR 可安全返回给业务路由的固定状态错误。 */
class LocalOcrError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

let nextError: LocalOcrError | undefined
let recognizeCallCount = 0

mock.module("@/lib/tools/local-paddle-ocr", {
  namedExports: {
    LocalOcrError,
    recognizeLocalOcrFile: async () => {
      recognizeCallCount += 1
      throw nextError
    },
  },
})

let post: (request: Request) => Promise<Response>

before(async () => {
  const route = await import("./route")
  post = route.POST
})

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
      nextError = new LocalOcrError(expected.message, expected.statusCode)
      recognizeCallCount = 0

      const response = await post(createImageRequest())

      assert.equal(response.status, expected.statusCode)
      assert.deepEqual(await response.json(), { error: expected.message })
      assert.equal(recognizeCallCount, 1)
    })
  }
})

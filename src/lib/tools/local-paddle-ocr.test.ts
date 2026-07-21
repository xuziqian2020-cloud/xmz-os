import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { LocalOcrError, getLocalOcrPaths } from "./local-paddle-ocr"

describe("本机 PaddleOCR 运行目录", () => {
  it("固定在项目根目录下的 .local-ocr", () => {
    const paths = getLocalOcrPaths("E:\\XMZAI\\xmz-os")

    assert.equal(paths.root, "E:\\XMZAI\\xmz-os\\.local-ocr")
    assert.equal(paths.python, "E:\\XMZAI\\xmz-os\\.local-ocr\\venv\\Scripts\\python.exe")
    assert.equal(paths.models, "E:\\XMZAI\\xmz-os\\.local-ocr\\models")
    assert.equal(paths.temp, "E:\\XMZAI\\xmz-os\\.local-ocr\\temp")
    assert.equal(paths.pipCache, "E:\\XMZAI\\xmz-os\\.local-ocr\\pip-cache")
  })

  it("保留本机 OCR 错误对应的 HTTP 状态码", () => {
    const error = new LocalOcrError("本机 OCR 环境不可用", 503)

    assert.equal(error.message, "本机 OCR 环境不可用")
    assert.equal(error.statusCode, 503)
    assert.equal(error.name, "LocalOcrError")
  })
})

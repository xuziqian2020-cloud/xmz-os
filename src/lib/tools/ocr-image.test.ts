import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getOcrLanguage, isSupportedImageFile } from "./ocr-image"

describe("OCR 图片输入", () => {
  it("允许常见图片和相机格式作为 OCR 输入", () => {
    for (const file of [
      { name: "截图.png", type: "image/png" },
      { name: "scan.webp", type: "application/octet-stream" },
      { name: "photo.heic", type: "" },
      { name: "contract.tiff", type: "image/tiff" },
      { name: "diagram.svg", type: "image/svg+xml" },
    ]) {
      assert.equal(isSupportedImageFile(file), true, `${file.name} 应该允许识别`)
    }
  })

  it("拒绝明显不是图片的文件", () => {
    assert.equal(isSupportedImageFile({ name: "说明.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), false)
    assert.equal(isSupportedImageFile({ name: "notes.txt", type: "text/plain" }), false)
  })

  it("默认使用中英文混合识别，英文模式可单独指定", () => {
    assert.equal(getOcrLanguage(null), "chi_sim+eng")
    assert.equal(getOcrLanguage("eng"), "eng")
  })
})

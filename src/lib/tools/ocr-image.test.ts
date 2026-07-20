import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getOcrLanguage, isSupportedImageFile, isSupportedOcrFile, validateOcrFile } from "./ocr-image"

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

  it("允许 PDF 用于 Unlimited-OCR，但不接受 Word 文档", () => {
    assert.equal(isSupportedOcrFile({ name: "合同.pdf", type: "application/pdf", size: 1024 }), true)
    assert.equal(isSupportedOcrFile({ name: "scan.pdf", type: "application/octet-stream", size: 1024 }), true)
    assert.equal(isSupportedOcrFile({ name: "说明.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1024 }), false)
    assert.equal(isSupportedOcrFile({ name: "伪装.pdf", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1024 }), false)
  })

  it("在上传前拦截超过百度 file_data 接口限制的图片和 PDF", () => {
    assert.equal(validateOcrFile({ name: "large.png", type: "image/png", size: 10 * 1024 * 1024 + 1 }), "图片文件不能超过 10MB")
    assert.equal(validateOcrFile({ name: "large.pdf", type: "application/pdf", size: 50 * 1024 * 1024 + 1 }), "PDF 文件不能超过 50MB")
  })
})

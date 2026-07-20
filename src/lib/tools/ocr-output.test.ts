import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildOcrResultPayload, plainTextToTable } from "./ocr-output"

describe("OCR result output formats", () => {
  it("builds text, markdown, word, and table outputs from recognized text", () => {
    const result = buildOcrResultPayload("ocr-sample.png", "姓名 金额\n张三 120\n李四 300")

    assert.equal(result.text.includes("张三"), true)
    assert.equal(result.markdown.includes("# ocr-sample"), true)
    assert.equal(result.wordFile.fileName, "ocr-sample.doc")
    assert.equal(result.wordFile.contentType, "application/msword;charset=utf-8")
    assert.match(result.wordFile.fileData, /^[A-Za-z0-9+/=]+$/)
    assert.equal(result.tableText, "姓名\t金额\n张三\t120\n李四\t300")
  })

  it("keeps non-table OCR text readable in table mode instead of producing mojibake", () => {
    assert.equal(plainTextToTable("第一行文字\n第二行文字"), "第一行文字\n第二行文字")
  })
})

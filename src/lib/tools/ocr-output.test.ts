import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildOcrResultPayload, extractPlainTextFromMarkdown, plainTextToTable } from "./ocr-output"

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

  it("保留 Unlimited-OCR 返回的 Markdown 表格，并生成已有下载格式", () => {
    const markdown = "# 账单\n\n| 姓名 | 金额 |\n| --- | --- |\n| 张三 | 120 |"
    const result = buildOcrResultPayload("ocr-sample.png", markdown)

    assert.equal(result.markdown, markdown)
    assert.equal(result.text.includes("张三"), true)
    assert.equal(result.tableText.includes("姓名\t金额"), true)
    assert.match(result.wordFile.fileData, /^[A-Za-z0-9+/=]+$/)
  })

  it("保留 Unlimited-OCR 返回的非表格 Markdown 结构", () => {
    const markdown = "**合同摘要**\n\n- 第一项\n- 第二项\n\n[查看原件](https://example.com)"

    assert.equal(buildOcrResultPayload("ocr-sample.png", markdown).markdown, markdown)
  })

  it("将 Unlimited-OCR 的 HTML 表格转换为可复制文本", () => {
    const html = "<table><tr><th>名称</th><th>金额</th></tr><tr><td>张三</td><td>120</td></tr></table>"

    assert.equal(extractPlainTextFromMarkdown(html), "名称\t金额\n张三\t120")
  })

  it("保留普通 OCR 文本中不代表表格的竖线", () => {
    assert.equal(extractPlainTextFromMarkdown("编码 A|B"), "编码 A|B")
  })

  it("保留普通 OCR 文本中的比较尖括号", () => {
    assert.equal(extractPlainTextFromMarkdown("金额 < 100 > 50"), "金额 < 100 > 50")
  })
})

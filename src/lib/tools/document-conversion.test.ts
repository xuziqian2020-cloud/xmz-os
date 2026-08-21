import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import {
  buildPdfFileName,
  buildWordFileName,
  buildWordHtmlDocument,
  getKnowledgeFileTitle,
  isTextLikeFile,
} from "./document-conversion"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("文档转换工具", () => {
  it("生成 Word 可打开的 HTML 文档并转义正文", () => {
    const html = buildWordHtmlDocument("接口说明", "第一行\n<script>alert(1)</script>")

    assert.match(html, /<meta charset="UTF-8">/)
    assert.match(html, /接口说明/)
    assert.match(html, /第一行/)
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  })

  it("按原文件名生成转换后的下载文件名", () => {
    assert.equal(buildWordFileName("需求文档.pdf"), "需求文档.doc")
    assert.equal(buildPdfFileName("会议纪要.docx"), "会议纪要.pdf")
    assert.equal(getKnowledgeFileTitle("方案.v1.final.docx"), "方案.v1.final")
  })

  it("识别知识库可以直接读取的文本类文件", () => {
    assert.equal(isTextLikeFile("data.csv", "text/csv"), true)
    assert.equal(isTextLikeFile("config.json", "application/json"), true)
    assert.equal(isTextLikeFile("page.html", "text/html"), true)
    assert.equal(isTextLikeFile("archive.zip", "application/zip"), false)
  })

  it("本地 AI 工具暴露 PDF 转 Word 和 Word 转 PDF", () => {
    const page = source("../../app/tools/page.tsx")

    assert.ok(page.includes("/tools/pdf-to-word"))
    assert.ok(page.includes("/tools/word-to-pdf"))
  })

  it("Word 转 PDF 不再走 pdfkit 的 Helvetica AFM 兜底", () => {
    const route = source("../../app/api/tools/word-to-pdf/route.ts")
    const fontCandidatesIndex = route.indexOf("const candidates")

    assert.equal(route.includes('doc.font(fontPath ? "xmz-cn" : "Helvetica")'), false)
    assert.match(route, /autoFirstPage:\s*false/)
    assert.match(route, /loadPdfKit/)
    assert.match(route, /eval\("require"\)/)
    assert.match(route, /node_modules", "pdfkit", "js", "pdfkit\.js"/)
    assert.match(route, /simhei\.ttf/)
    assert.equal(route.includes("Helvetica.afm"), false)
    assert.equal(route.includes("C:\\\\Windows\\\\Fonts"), false)
    assert.ok(fontCandidatesIndex > 0)
    assert.ok(route.indexOf("simhei.ttf") < route.indexOf("msyh.ttc"))
  })
})

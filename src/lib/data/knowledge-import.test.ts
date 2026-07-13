import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { POST as extractDocumentPost } from "../../app/api/tools/extract-document/route"

const source = readFileSync(new URL("../../app/knowledge/new/page.tsx", import.meta.url), "utf8")

describe("knowledge file import page", () => {
  it("uses the server extraction endpoint instead of only File.text markdown import", () => {
    assert.match(source, /\/api\/tools\/extract-document/)
    assert.equal(source.includes("accept=\".md,.markdown,.txt,text/markdown,text/plain\""), false)
  })

  it("keeps non-zip docx files importable as metadata instead of surfacing parser errors", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new File([new Uint8Array([0xe0, 0xa8, 0x91, 0xe7, 0xd8, 0xf2])], "二次开发学习文档.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    )

    const response = await extractDocumentPost(new Request("http://local.test/api/tools/extract-document", {
      method: "POST",
      body: formData,
    }))
    const data = await response.json()

    assert.equal(response.status, 200)
    assert.equal(data.source, "二次开发学习文档.docx")
    assert.match(data.content, /二次开发学习文档\.docx/)
    assert.doesNotMatch(JSON.stringify(data), /central directory|stuk\.github/i)
  })

  it("exposes a multi-file import flow for knowledge and experience documents", () => {
    assert.match(source, /multiple/)
    assert.match(source, /handleImportFiles/)
    assert.match(source, /Array\.from\(files\)/)
    assert.match(source, /\/api\/knowledge/)
    assert.match(source, /batchImporting/)
  })
})

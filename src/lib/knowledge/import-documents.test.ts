import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildKnowledgeImportPayload } from "./import-documents"

describe("knowledge document import payload", () => {
  it("uses the file name and fixed knowledge defaults for batch imports", () => {
    const payload = buildKnowledgeImportPayload(
      { title: "extracted title", content: "document body", source: "ignored.md" },
      { name: "guide.md", webkitRelativePath: "docs/guide.md" },
    )

    assert.deepEqual(payload, {
      title: "guide.md",
      content: "document body",
      category: "技术文档",
      source: "docs/guide.md",
      project_id: null,
    })
  })

  it("falls back to the file name when the browser has no relative path", () => {
    const payload = buildKnowledgeImportPayload(
      { content: "plain text" },
      { name: "notes.txt" },
    )

    assert.equal(payload.title, "notes.txt")
    assert.equal(payload.source, "notes.txt")
    assert.equal(payload.project_id, null)
  })
})

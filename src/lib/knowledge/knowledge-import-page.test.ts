import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const page = readFileSync(new URL("../../app/knowledge/new/page.tsx", import.meta.url), "utf8")

describe("knowledge import page", () => {
  it("offers both file and directory import controls", () => {
    assert.match(page, /const folderInputProps = \{ webkitdirectory: "", directory: "" \}/)
    assert.match(page, /multiple \{\.\.\.folderInputProps\}/)
    assert.match(page, /multiple onChange=\{\(event\) => handleImportFiles\(event\.target\.files\)\}/)
  })

  it("treats a directory as a batch even when it contains one file", () => {
    assert.match(page, /fileList\.length > 1 \|\| fileList\.some\(\(file\) => Boolean\(file\.webkitRelativePath\)\)/)
  })

  it("uses fixed batch payloads and clears the manual form after importing", () => {
    assert.match(page, /buildKnowledgeImportPayload\(data, file\)/)
    assert.match(page, /resetManualForm\(\)/)
    assert.doesNotMatch(page, /function buildDocumentPayload/)
  })
})

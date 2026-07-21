import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("multi file upload entry points", () => {
  it("files page allows selecting multiple files and uploads every selected file", () => {
    const source = readFileSync("src/app/files/page.tsx", "utf8")

    assert.match(source, /type="file"[\s\S]*?multiple/)
    assert.match(source, /Array\.from\(e\.target\.files/)
    assert.match(source, /for \(const file of fileList\)/)
    assert.match(source, /successCount/)
  })

  it("knowledge import supports batch file and folder selection", () => {
    const source = readFileSync("src/app/knowledge/new/page.tsx", "utf8")

    assert.match(source, /async function handleImportFiles/)
    assert.match(source, /type="file"[\s\S]*?multiple/)
    assert.match(source, /buildKnowledgeImportPayload\(data, file\)/)
    assert.match(source, /multiple \{\.\.\.folderInputProps\}/)
  })
})

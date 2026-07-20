import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("../../app/files/page.tsx", import.meta.url), "utf8")

describe("files page layout", () => {
  it("keeps long file types from covering the file name", () => {
    assert.match(source, /grid-cols-\[minmax\(0,1fr\)_/)
    assert.match(source, /break-all/)
    assert.match(source, /title=\{file\.file_name/)
  })

  it("supports folder upload, folder browsing, and file preview from the files page", () => {
    assert.match(source, /webkitdirectory/)
    assert.match(source, /webkitRelativePath/)
    assert.match(source, /folderGroups/)
    assert.match(source, /openFolders/)
    assert.match(source, /previewFile/)
    assert.match(source, /\/download\?preview=1/)
  })
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("../../app/files/page.tsx", import.meta.url), "utf8")

describe("files page layout", () => {
  it("keeps long file types from covering the file name", () => {
    assert.match(source, /grid-cols-\[minmax\(0,1fr\)_/)
    assert.match(source, /break-all/)
    assert.match(source, /title=\{f\.file_name\}/)
  })
})

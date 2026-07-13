import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("../../app/tools/page.tsx", import.meta.url), "utf8")

describe("tools page", () => {
  it("exposes links for OCR, document conversion, audio/video transcription and meetings", () => {
    for (const href of [
      "/tools/ocr",
      "/tools/pdf-to-markdown",
      "/tools/word-to-markdown",
      "/tools/transcription",
      "/tools/meeting-minutes",
    ]) {
      assert.ok(source.includes(href), `缺少 ${href}`)
    }
    assert.equal(source.includes("TODO"), false)
  })
})

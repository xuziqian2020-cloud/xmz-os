import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { resolveStoredFileDownload } from "./download"

describe("file download", () => {
  it("converts database fallback data URLs into downloadable bytes", () => {
    const result = resolveStoredFileDownload({
      file_name: "说明.txt",
      file_type: "plain",
      storage_path: "data:text/plain;base64,5L2g5aW9",
    })

    assert.equal(result.kind, "inline")
    if (result.kind === "inline") {
      assert.equal(result.fileName, "说明.txt")
      assert.equal(result.contentType, "text/plain")
      assert.equal(Buffer.from(result.bytes).toString("utf8"), "你好")
    }
  })

  it("marks http storage URLs as remote downloads through the app route", () => {
    const result = resolveStoredFileDownload({
      file_name: "a.pdf",
      file_type: "pdf",
      storage_path: "https://example.com/a.pdf",
    })

    assert.deepEqual(result, {
      kind: "remote",
      url: "https://example.com/a.pdf",
      fileName: "a.pdf",
      contentType: "application/pdf",
    })
  })
})

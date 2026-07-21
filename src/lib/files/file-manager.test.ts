import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildFolderGroups, getBaseName, getPreviewType } from "./file-manager"

describe("file manager grouping and preview", () => {
  it("groups every nested file under its uploaded top-level folder", () => {
    const groups = buildFolderGroups([
      { id: "1", file_name: "docs/readme.md" },
      { id: "2", file_name: "docs/api/routes.md" },
      { id: "3", file_name: "standalone.txt" },
    ])

    assert.equal(groups.length, 1)
    assert.equal(groups[0].name, "docs")
    assert.deepEqual(groups[0].files.map((file) => file.id), ["1", "2"])
    assert.equal(getBaseName(groups[0].files[1]), "routes.md")
  })

  it("renders markdown and text formats as application text previews", () => {
    assert.equal(getPreviewType({ id: "1", file_name: "readme.md", file_type: "md" }), "text")
    assert.equal(getPreviewType({ id: "2", file_name: "data.json", file_type: "json" }), "text")
    assert.equal(getPreviewType({ id: "3", file_name: "manual.pdf", file_type: "pdf" }), "frame")
    assert.equal(getPreviewType({ id: "4", file_name: "photo.png", file_type: "png" }), "image")
  })
})

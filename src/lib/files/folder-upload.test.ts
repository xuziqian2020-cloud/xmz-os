import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("folder upload and preview", () => {
  it("stores browser folder relative paths when uploading a directory", () => {
    const uploadRoute = source("../../app/api/files/upload/route.ts")

    assert.match(uploadRoute, /relative_path/)
    assert.match(uploadRoute, /sanitizeRelativePath/)
    assert.match(uploadRoute, /displayName/)
    assert.match(uploadRoute, /file_name:\s*displayName/)
  })

  it("lets the download route return inline content for previews", () => {
    const downloadRoute = source("../../app/api/files/[id]/download/route.ts")

    assert.match(downloadRoute, /searchParams\.get\("preview"\)\s*===\s*"1"/)
    assert.match(downloadRoute, /buildContentDisposition\(download\.fileName,\s*preview\)/)
  })

  it("renders text previews inside the application instead of a white iframe", () => {
    const filesPage = source("../../app/files/page.tsx")

    assert.match(filesPage, /previewType === "text"/)
    assert.match(filesPage, /<pre/)
    assert.match(filesPage, /response\.text\(\)/)
  })

  it("lets users select and delete a complete uploaded folder", () => {
    const filesPage = source("../../app/files/page.tsx")
    const bulkRoute = source("../../app/api/files/bulk/route.ts")

    assert.match(filesPage, /toggleFolderSelection/)
    assert.match(filesPage, /handleDeleteFolder/)
    assert.match(filesPage, /fetch\("\/api\/files\/bulk"/)
    assert.match(bulkRoute, /Array\.isArray\(body\.ids\)/)
    assert.match(bulkRoute, /\.in\("id", ids\)/)
  })
})

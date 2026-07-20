import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

function readAppFile(path: string) {
  return readFileSync(resolve(root, path), "utf8")
}

describe("bulk list actions", () => {
  const searchableBulkPages = [
    "src/app/process/page.tsx",
    "src/app/ideas/page.tsx",
    "src/app/knowledge/page.tsx",
    "src/app/prompts/page.tsx",
    "src/app/files/page.tsx",
    "src/app/plans/page.tsx",
    "src/app/bugs/page.tsx",
  ]

  for (const page of searchableBulkPages) {
    it(`${page} supports keyword search and selected batch delete`, () => {
      const source = readAppFile(page)
      assert.match(source, /search/)
      assert.match(source, /selectedIds/)
      assert.match(source, /toggleSelection/)
      assert.match(source, /handleBulkDelete/)
      assert.match(source, /批量删除/)
    })
  }

  it("files page searches by file_name", () => {
    const source = readAppFile("src/app/files/page.tsx")
    assert.match(source, /file_name/)
    assert.match(source, /includes\(keyword\)/)
  })

  it("prompt page deletes local and server prompts in one selected action", () => {
    const source = readAppFile("src/app/prompts/page.tsx")
    assert.match(source, /deleteLocalPrompts/)
    assert.match(source, /String\(prompt\.id\)\.startsWith\("local-"\)/)
  })

  it("work plans and bugs expose batch priority and completion status updates", () => {
    for (const page of ["src/app/plans/page.tsx", "src/app/bugs/page.tsx"]) {
      const source = readAppFile(page)
      assert.match(source, /handleBulkStatusUpdate/)
      assert.match(source, /handleBulkPriorityUpdate/)
      assert.match(source, /\/api\/work-plans\/bulk/)
    }
  })

  it("work plan bulk api exists for batch delete and status updates", () => {
    const apiPath = resolve(root, "src/app/api/work-plans/bulk/route.ts")
    assert.equal(existsSync(apiPath), true)
    const source = readFileSync(apiPath, "utf8")
    assert.match(source, /export async function PUT/)
    assert.match(source, /export async function DELETE/)
    assert.match(source, /\.in\("id", ids\)/)
  })
})

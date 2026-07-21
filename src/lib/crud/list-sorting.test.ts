import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

function readAppFile(path: string) {
  return readFileSync(resolve(root, path), "utf8")
}

describe("module list sorting", () => {
  it("orders work plan and bug lists by created time only", () => {
    const dataSource = readAppFile("src/lib/data/work-plans.ts")
    const apiSource = readAppFile("src/app/api/work-plans/route.ts")
    const bugsPageSource = readAppFile("src/app/bugs/page.tsx")
    const getWorkPlansSource = dataSource.slice(dataSource.indexOf("export async function getWorkPlans"), dataSource.indexOf("export async function getDashboardWorkPlans"))

    assert.match(getWorkPlansSource, /\.order\("created_at", \{ ascending: false \}\)/)
    assert.doesNotMatch(getWorkPlansSource, /\.order\("priority"/)
    assert.match(apiSource, /\.order\("created_at", \{ ascending: false \}\)/)
    assert.doesNotMatch(apiSource, /\.order\("priority"/)
    assert.match(bugsPageSource, /fetch\("\/api\/work-plans\?type=bug"/)
  })

  it("orders knowledge, prompt, process, files, and ideas APIs by created time descending", () => {
    for (const path of [
      "src/app/api/knowledge/route.ts",
      "src/app/api/prompts/route.ts",
      "src/app/api/diagrams/route.ts",
      "src/app/api/files/route.ts",
      "src/app/api/ideas/route.ts",
    ]) {
      const source = readAppFile(path)
      assert.match(source, /\.order\("created_at", \{ ascending: false \}\)/, `${path} should sort newest records first`)
      assert.doesNotMatch(source, /\.order\("updated_at"/, `${path} should not sort by last edit time`)
    }
  })
})

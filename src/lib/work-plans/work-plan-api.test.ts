import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const listSource = readFileSync(new URL("../../app/api/work-plans/route.ts", import.meta.url), "utf8")
const detailSource = readFileSync(new URL("../../app/api/work-plans/[id]/route.ts", import.meta.url), "utf8")
const bulkSource = readFileSync(new URL("../../app/api/work-plans/bulk/route.ts", import.meta.url), "utf8")

describe("work plan api", () => {
  it("falls back to a default project instead of rejecting empty project_id", () => {
    assert.match(listSource, /ensureDefaultProject/)
    assert.equal(listSource.includes("请选择所属项目"), false)
  })

  it("allows local admin dashboard reads through an explicit request header", () => {
    assert.match(listSource, /x-xmz-local-admin/)
    assert.match(listSource, /isLocalAdminRequest/)
  })

  it("resets progress to 0 when a completed plan is changed back to in progress", () => {
    assert.match(detailSource, /body\.status\s*===\s*"进行中"[\s\S]*nextProgress\s*=\s*0/)
    assert.match(bulkSource, /statusRule\.status\s*===\s*"进行中"[\s\S]*updatePayload\.progress\s*=\s*0/)
  })
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("../../app/api/work-plans/route.ts", import.meta.url), "utf8")

describe("work plan api", () => {
  it("falls back to a default project instead of rejecting empty project_id", () => {
    assert.match(source, /ensureDefaultProject/)
    assert.equal(source.includes("请选择所属项目"), false)
  })

  it("allows local admin dashboard reads through an explicit request header", () => {
    assert.match(source, /x-xmz-local-admin/)
    assert.match(source, /isLocalAdminRequest/)
  })
})

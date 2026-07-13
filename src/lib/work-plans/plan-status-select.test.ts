import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("../../components/plans/plan-status-select.tsx", import.meta.url), "utf8")

describe("plan status select", () => {
  it("uses parent optimistic merge before falling back to router refresh", () => {
    assert.match(source, /if \(!onSaved\) router\.refresh\(\)/)
    assert.equal(source.includes("onSaved?.(data)\n        router.refresh()"), false)
  })
})

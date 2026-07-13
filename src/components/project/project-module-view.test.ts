import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("./project-module-view.tsx", import.meta.url), "utf8")

describe("ProjectModuleView", () => {
  it("does not let child plan rows call the parent-only loadItems function directly", () => {
    const itemFunction = source.slice(source.indexOf("function ProjectModuleItem"))

    assert.ok(itemFunction.includes("onItemSaved"))
    assert.equal(itemFunction.includes("onSaved={loadItems}"), false)
  })
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("mobile application layout", () => {
  it("keeps the workspace readable while preserving access to navigation", () => {
    const sidebar = readFileSync("src/components/layout/sidebar.tsx", "utf8")
    const layout = readFileSync("src/components/layout/app-layout.tsx", "utf8")

    assert.match(sidebar, /mobileOpen/)
    assert.match(sidebar, /md:hidden/)
    assert.match(sidebar, /aria-label="关闭导航菜单"/)
    assert.match(sidebar, /<X className="h-4 w-4" \/>/)
    assert.match(layout, /md:pl-64/)
    assert.match(layout, /px-4 py-4 sm:px-6 sm:py-6/)
  })
})

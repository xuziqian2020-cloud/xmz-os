import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("navigation prefetch", () => {
  it("disables broad sidebar prefetch to keep page switches responsive", () => {
    const sidebar = readFileSync(new URL("../components/layout/sidebar.tsx", import.meta.url), "utf8")

    assert.match(sidebar, /prefetch=\{false\}/)
  })

  it("does not prefetch every local AI tool card at once", () => {
    const tools = readFileSync(new URL("../app/tools/page.tsx", import.meta.url), "utf8")

    assert.match(tools, /<Link href=\{href\} prefetch=\{false\}/)
  })

  it("keeps dashboard quick links from preloading many create pages", () => {
    const dashboard = readFileSync(new URL("../components/dashboard/dashboard-client.tsx", import.meta.url), "utf8")
    const header = readFileSync(new URL("../components/layout/header.tsx", import.meta.url), "utf8")

    assert.match(dashboard, /href=\{action\.href\}\s+prefetch=\{false\}/)
    assert.match(dashboard, /<Link href=\{href\} prefetch=\{false\}/)
    assert.match(header, /href="\/plans\/new"\s+prefetch=\{false\}/)
  })

  it("does not force smooth scrolling globally because it slows workbench navigation", () => {
    const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")

    assert.doesNotMatch(globals, /scroll-behavior:\s*smooth/)
  })
})

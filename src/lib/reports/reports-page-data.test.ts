import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("reports page data loading", () => {
  it("loads report source data on the server instead of browser-side API fallbacks", () => {
    const page = readFileSync(new URL("../../app/reports/page.tsx", import.meta.url), "utf8")
    const client = readFileSync(new URL("../../components/reports/reports-client.tsx", import.meta.url), "utf8")
    const dataSource = readFileSync(new URL("../data/reports.ts", import.meta.url), "utf8")

    assert.match(page, /getReportsInput/)
    assert.match(page, /<ReportsClient initialData=\{data\}/)
    assert.match(client, /initialData/)
    assert.doesNotMatch(client, /\/api\/work-plans/)
    assert.doesNotMatch(client, /fetchJson/)
    assert.match(dataSource, /getWorkPlans\(\{\s*limit:\s*500\s*\}\)/)
    assert.match(dataSource, /\.from\("prompt_templates"\)/)
    assert.match(dataSource, /\.from\("ideas"\)/)
  })
})

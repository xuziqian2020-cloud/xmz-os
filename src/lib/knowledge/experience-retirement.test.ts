import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("experience library retirement", () => {
  it("removes experience navigation and project module configuration", () => {
    assert.doesNotMatch(source("../menu-items.ts"), /href: "\/experiences"/)
    assert.doesNotMatch(source("../../app/projects/[id]/page.tsx"), /\/experiences/)
    assert.doesNotMatch(source("../../components/project/project-module-view.tsx"), /"experiences"/)
  })

  it("redirects legacy experience routes to knowledge", () => {
    const nextConfig = source("../../../next.config.js")

    assert.match(source("../../app/experiences/page.tsx"), /redirect\("\/knowledge"\)/)
    assert.match(source("../../app/projects/[id]/experiences/page.tsx"), /redirect\(`\/projects\/\$\{params\.id\}\/knowledge`\)/)
    assert.match(nextConfig, /source: "\/experiences"[\s\S]*destination: "\/knowledge"/)
    assert.match(nextConfig, /source: "\/projects\/:id\/experiences"[\s\S]*destination: "\/projects\/:id\/knowledge"/)
  })

  it("removes experience-specific knowledge form and project stats code", () => {
    assert.doesNotMatch(source("../../app/knowledge/new/page.tsx"), /fromExperience|EXPERIENCE_CATEGORY/)
    assert.doesNotMatch(source("../data/projects.ts"), /experienceCount|经验库/)
    assert.doesNotMatch(source("../crud/module-audit.test.ts"), /src\/app\/experiences/)
  })
})

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { normalizeProjectTechStack } from "./projects"

describe("project data helpers", () => {
  it("normalizes old text tech_stack values before pages render them", () => {
    assert.deepEqual(normalizeProjectTechStack(["React", "Next"]), ["React", "Next"])
    assert.deepEqual(normalizeProjectTechStack("React, Next, Supabase"), ["React", "Next", "Supabase"])
    assert.deepEqual(normalizeProjectTechStack(null), [])
  })
})

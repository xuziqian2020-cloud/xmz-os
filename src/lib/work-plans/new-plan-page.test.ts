import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("../../app/plans/new/page.tsx", import.meta.url), "utf8")
const editSource = readFileSync(new URL("../../app/plans/[id]/edit/page.tsx", import.meta.url), "utf8")

describe("new plan page", () => {
  it("submits the current date input value even when React state lags behind the DOM", () => {
    assert.match(source, /dueDateRef/)
    assert.match(source, /dueDate \|\| dueDateRef\.current\?\.value/)
    assert.match(source, /onInput=\{\(event\) => setDueDate\(event\.currentTarget\.value\)\}/)
  })

  it("keeps the same date input fallback when editing a plan", () => {
    assert.match(editSource, /dueDateRef/)
    assert.match(editSource, /dueDate \|\| dueDateRef\.current\?\.value/)
    assert.match(editSource, /onInput=\{e => setDueDate\(e\.currentTarget\.value\)\}/)
  })

  it("shows bug-specific fields on the Bug creation flow", () => {
    assert.match(source, /bugSymptom/)
    assert.match(source, /bugErrorMessage/)
    assert.match(source, /bugReason/)
    assert.match(source, /bugSolution/)
  })

  it("submits bug-specific fields when creating a Bug", () => {
    assert.match(source, /body\.bug_symptom/)
    assert.match(source, /body\.bug_error_message/)
    assert.match(source, /body\.bug_reason/)
    assert.match(source, /body\.bug_solution/)
  })
})

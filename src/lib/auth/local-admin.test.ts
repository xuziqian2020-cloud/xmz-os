import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isAdminLoginName, normalizeLoginName } from "./local-admin"

describe("local admin login helpers", () => {
  it("accepts admin with surrounding spaces and mixed case", () => {
    assert.equal(isAdminLoginName(" admin "), true)
    assert.equal(isAdminLoginName("ADMIN"), true)
  })

  it("does not treat normal emails as admin", () => {
    assert.equal(isAdminLoginName("admin@example.com"), false)
  })

  it("normalizes ordinary login names", () => {
    assert.equal(normalizeLoginName(" User@Example.com "), "user@example.com")
  })
})

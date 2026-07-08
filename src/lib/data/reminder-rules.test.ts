import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getDaysUntilDue, shouldCreateDueSoonReminder, shouldCreateImportantPlanReminder } from "./reminder-rules"

describe("reminder rules", () => {
  it("detects due date distance in days", () => {
    assert.equal(getDaysUntilDue("2026-07-08", "2026-07-08"), 0)
    assert.equal(getDaysUntilDue("2026-07-11", "2026-07-08"), 3)
    assert.equal(getDaysUntilDue("2026-07-07", "2026-07-08"), -1)
  })

  it("warns important plans today and one day early", () => {
    assert.equal(shouldCreateImportantPlanReminder({ priority: "high", status: "开发中", due_date: "2026-07-08" }, "2026-07-08"), true)
    assert.equal(shouldCreateImportantPlanReminder({ priority: "high", status: "开发中", due_date: "2026-07-09" }, "2026-07-08"), true)
    assert.equal(shouldCreateImportantPlanReminder({ priority: "high", status: "开发中", due_date: "2026-07-10" }, "2026-07-08"), false)
  })

  it("warns active plans due within three days", () => {
    assert.equal(shouldCreateDueSoonReminder({ status: "进行中", due_date: "2026-07-11" }, "2026-07-08"), true)
    assert.equal(shouldCreateDueSoonReminder({ status: "进行中", due_date: "2026-07-12" }, "2026-07-08"), false)
    assert.equal(shouldCreateDueSoonReminder({ status: "已完成", due_date: "2026-07-09" }, "2026-07-08"), false)
  })
})

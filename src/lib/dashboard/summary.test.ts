import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildDashboardSummary } from "./summary"

describe("dashboard summary", () => {
  it("builds today, week, and in-progress views with the requested metric rules", () => {
    const summary = buildDashboardSummary([
      plan("today-active", "today active", "2026-07-10", "high", "进行中", 20),
      plan("today-done", "today done", "2026-07-10", "medium", "已完成", 0),
      plan("today-rejected", "today rejected", "2026-07-10", "high", "已拒绝", 0),
      plan("week-active", "week active", "2026-07-12", "low", "进行中", 60),
      plan("next-week", "next week", "2026-07-20", "medium", "进行中", 10),
      plan("no-date", "no date", null, "medium", "进行中", 80),
      { ...plan("deleted", "deleted", "2026-07-10", "high", "进行中", 0), deleted_at: "2026-07-10" },
    ], new Date(2026, 6, 10, 9, 0, 0))

    assert.deepEqual(summary.todayPlans.map((item) => item.id), ["today-active", "today-done", "today-rejected"])
    assert.deepEqual(summary.weekPlans.map((item) => item.id), [
      "today-active",
      "week-active",
      "today-done",
      "today-rejected",
    ])
    assert.deepEqual(summary.inProgressPlans.map((item) => item.id), [
      "today-active",
      "week-active",
      "next-week",
      "no-date",
    ])

    assert.deepEqual(summary.metrics.today, {
      planCount: 3,
      importantCount: 2,
      unfinishedCount: 1,
      averageProgress: 33,
    })
    assert.deepEqual(summary.metrics.week, {
      planCount: 4,
      importantCount: 2,
      unfinishedCount: 2,
      averageProgress: 25,
    })
    assert.deepEqual(summary.metrics.inProgress, {
      planCount: 4,
      importantCount: 1,
      unfinishedCount: 4,
      averageProgress: 0,
    })

    assert.equal(summary.todayReminders.length, 1)
    assert.equal(summary.weekReminders.length, 2)
  })

  it("only keeps active overdue plans in the today queue", () => {
    const summary = buildDashboardSummary([
      plan("overdue-active", "overdue active", "2026-07-07", "medium", "进行中", 30),
      plan("overdue-done", "overdue done", "2026-07-07", "high", "已完成", 100),
      plan("overdue-rejected", "overdue rejected", "2026-07-07", "high", "已拒绝", 0),
      plan("today-active", "today active", "2026-07-08", "low", "进行中", 0),
    ], new Date(2026, 6, 8, 9, 0, 0))

    assert.deepEqual(summary.todayPlans.map((item) => item.id), ["overdue-active", "today-active"])
    assert.deepEqual(summary.weekPlans.map((item) => item.id), ["overdue-active", "today-active"])
    assert.equal(summary.metrics.today.planCount, 2)
    assert.equal(summary.metrics.today.unfinishedCount, 2)
    assert.equal(summary.metrics.today.averageProgress, 0)
    assert.equal(summary.todayReminders[0]?.reminder_type, "plan_overdue")
  })

  it("sorts today and week queues by visible status first, then due date", () => {
    const summary = buildDashboardSummary([
      plan("done-early", "done early", "2026-07-06", "high", "已完成", 100),
      plan("rejected-early", "rejected early", "2026-07-05", "high", "已拒绝", 0),
      plan("active-late", "active late", "2026-07-12", "low", "进行中", 10),
      plan("active-early", "active early", "2026-07-07", "medium", "进行中", 20),
      plan("done-late", "done late", "2026-07-11", "low", "已完成", 100),
      plan("rejected-late", "rejected late", "2026-07-10", "low", "已拒绝", 0),
    ], new Date(2026, 6, 8, 9, 0, 0))

    assert.deepEqual(summary.weekPlans.map((item) => item.id), [
      "active-early",
      "active-late",
      "done-late",
      "rejected-late",
    ])
  })

  it("sorts the in-progress queue only by due date", () => {
    const summary = buildDashboardSummary([
      plan("active-late-high", "active late high", "2026-07-12", "high", "进行中", 10),
      plan("active-early-low", "active early low", "2026-07-07", "low", "进行中", 10),
      plan("active-no-date", "active no date", null, "high", "进行中", 10),
      plan("active-middle-medium", "active middle medium", "2026-07-09", "medium", "进行中", 10),
    ], new Date(2026, 6, 8, 9, 0, 0))

    assert.deepEqual(summary.inProgressPlans.map((item) => item.id), [
      "active-early-low",
      "active-middle-medium",
      "active-late-high",
      "active-no-date",
    ])
  })
})

function plan(
  id: string,
  title: string,
  dueDate: string | null,
  priority: string,
  status: string,
  progress: number
) {
  return {
    id,
    title,
    type: "requirement",
    priority,
    status,
    progress,
    due_date: dueDate,
    description: "",
  }
}

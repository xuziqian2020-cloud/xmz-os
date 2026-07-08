import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildReport, getReportLabel } from "./generate-report"

describe("buildReport", () => {
  it("generates a weekly report with counts and plan bullets", () => {
    const report = buildReport(
      "weekly",
      {
        projects: [{ name: "XMZ OS" }],
        plans: [
          { title: "修复登录", status: "处理中", priority: "high" },
          { title: "上线复盘", status: "已完成", priority: "medium" },
        ],
        knowledge: [{ title: "Supabase 配置说明" }],
        prompts: [{ title: "周报提示词" }],
        ideas: [],
      },
      new Date("2026-07-08T00:00:00+08:00")
    )

    assert.equal(getReportLabel("weekly"), "周报")
    assert.equal(report.stats.projectCount, 1)
    assert.equal(report.stats.highPlanCount, 1)
    assert.match(report.content, /修复登录/)
    assert.match(report.content, /Supabase 配置说明/)
  })
})

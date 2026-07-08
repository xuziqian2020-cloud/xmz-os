import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildReport,
  buildReportDocumentHtml,
  getReportLabel,
} from "./generate-report"

const sampleInput = {
  projects: [{ name: "XMZ OS" }],
  plans: [
    { title: "修复登录", status: "处理中", priority: "high" },
    { title: "上线复盘", status: "已完成", priority: "medium" },
  ],
  knowledge: [{ title: "Supabase 配置说明" }],
  prompts: [{ title: "周报提示词" }],
  ideas: [],
}

describe("buildReport", () => {
  it("生成中文周报内容和统计", () => {
    const report = buildReport("weekly", sampleInput, new Date("2026-07-08T00:00:00+08:00"))

    assert.equal(getReportLabel("weekly"), "周报")
    assert.equal(report.stats.projectCount, 1)
    assert.equal(report.stats.highPlanCount, 1)
    assert.match(report.content, /一、本期概览/)
    assert.match(report.content, /修复登录/)
    assert.match(report.content, /Supabase 配置说明/)
  })

  it("生成可用 Word 打开的文章格式 HTML", () => {
    const report = buildReport("daily", sampleInput, new Date("2026-07-08T00:00:00+08:00"))
    const html = buildReportDocumentHtml(report, sampleInput, new Date("2026-07-08T09:30:00+08:00"))

    assert.match(html, /<html/)
    assert.match(html, /日报报告/)
    assert.match(html, /本期概览/)
    assert.match(html, /修复登录/)
    assert.match(html, /font-family/)
  })
})

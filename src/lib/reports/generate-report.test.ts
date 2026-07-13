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
    const report = buildReport("weekly", sampleInput, new Date("2026-07-08T00:00:00+08:00"))
    const html = buildReportDocumentHtml(report, sampleInput, new Date("2026-07-08T09:30:00+08:00"))

    assert.match(html, /<html/)
    assert.match(html, /周报报告/)
    assert.match(html, /统计期间：2026-07-06 至 2026-07-12/)
    assert.match(html, /本期概览/)
    assert.match(html, /修复登录/)
    assert.match(html, /font-family/)
  })

  it("按日报、周报、月报、年报分别筛选统计数据", () => {
    const rangeInput = {
      projects: [
        { name: "今日项目", updated_at: "2026-07-09T09:00:00+08:00" },
        { name: "本周项目", updated_at: "2026-07-07T09:00:00+08:00" },
        { name: "本月项目", updated_at: "2026-07-01T09:00:00+08:00" },
        { name: "全年项目", updated_at: "2026-01-10T09:00:00+08:00" },
      ],
      plans: [
        { title: "今天截止", due_date: "2026-07-09", status: "进行中", priority: "high" },
        { title: "本周截止", due_date: "2026-07-11", status: "进行中", priority: "medium" },
        { title: "本月截止", due_date: "2026-07-30", status: "已完成", priority: "low" },
        { title: "全年截止", due_date: "2026-12-30", status: "进行中", priority: "low" },
      ],
      knowledge: [{ title: "今日知识", created_at: "2026-07-09T10:00:00+08:00" }],
      prompts: [{ title: "本周 Prompt", updated_at: "2026-07-10T10:00:00+08:00" }],
      ideas: [{ title: "全年灵感", created_at: "2026-03-01T10:00:00+08:00" }],
    }

    const now = new Date("2026-07-09T12:00:00+08:00")
    assert.equal(buildReport("daily", rangeInput, now).stats.planCount, 1)
    assert.equal(buildReport("weekly", rangeInput, now).stats.planCount, 2)
    assert.equal(buildReport("monthly", rangeInput, now).stats.planCount, 3)
    assert.equal(buildReport("yearly", rangeInput, now).stats.planCount, 4)
    assert.match(buildReport("weekly", rangeInput, now).title, /2026-07-06 至 2026-07-12/)
  })

  it("does not drop local-day records when Supabase stores created_at in UTC", () => {
    const input = {
      projects: [{ name: "验收项目", created_at: "2026-07-12T16:41:42.000Z" }],
      plans: [],
      knowledge: [{ title: "验收知识", created_at: "2026-07-12T16:42:00.000Z" }],
      prompts: [{ title: "验收 Prompt", updated_at: "2026-07-12T16:43:00.000Z" }],
      ideas: [{ title: "验收灵感", created_at: "2026-07-12T16:44:00.000Z" }],
    }

    const report = buildReport("weekly", input, new Date("2026-07-13T09:00:00+08:00"))

    assert.equal(report.stats.projectCount, 1)
    assert.equal(report.stats.knowledgeCount, 1)
    assert.equal(report.stats.promptCount, 1)
    assert.equal(report.stats.ideaCount, 1)
  })
})

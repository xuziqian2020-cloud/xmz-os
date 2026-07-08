export type ReportKind = "daily" | "weekly" | "monthly" | "yearly"

export interface ReportItem {
  id?: string
  title?: string | null
  name?: string | null
  status?: string | null
  priority?: string | null
  type?: string | null
  category?: string | null
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ReportInput {
  projects: ReportItem[]
  plans: ReportItem[]
  knowledge: ReportItem[]
  prompts: ReportItem[]
  ideas: ReportItem[]
}

export interface BuiltReport {
  title: string
  label: string
  stats: {
    projectCount: number
    planCount: number
    activePlanCount: number
    donePlanCount: number
    knowledgeCount: number
    promptCount: number
    ideaCount: number
    highPlanCount: number
  }
  content: string
}

const reportLabels: Record<ReportKind, string> = {
  daily: "日报",
  weekly: "周报",
  monthly: "月报",
  yearly: "年报",
}

export function getReportLabel(kind: ReportKind): string {
  return reportLabels[kind]
}

export function buildReport(kind: ReportKind, input: ReportInput, now = new Date()): BuiltReport {
  const label = getReportLabel(kind)
  const title = `${now.toLocaleDateString("zh-CN")} ${label}`
  const activePlans = input.plans.filter((plan) => !isDone(plan.status))
  const donePlans = input.plans.filter((plan) => isDone(plan.status))
  const highPlans = input.plans.filter((plan) => plan.priority === "high" || plan.status === "重要")

  const stats = {
    projectCount: input.projects.length,
    planCount: input.plans.length,
    activePlanCount: activePlans.length,
    donePlanCount: donePlans.length,
    knowledgeCount: input.knowledge.length,
    promptCount: input.prompts.length,
    ideaCount: input.ideas.length,
    highPlanCount: highPlans.length,
  }

  return {
    title,
    label,
    stats,
    content: [
      `# ${title}`,
      "",
      "## 一、本期概览",
      `- 项目数：${stats.projectCount}`,
      `- 工作计划：${stats.planCount} 个，其中未完成 ${stats.activePlanCount} 个，已完成 ${stats.donePlanCount} 个`,
      `- 重要事项：${stats.highPlanCount} 个`,
      `- 知识沉淀：${stats.knowledgeCount} 篇，Prompt 模板：${stats.promptCount} 条，灵感：${stats.ideaCount} 条`,
      "",
      "## 二、重点计划",
      ...toBulletLines(input.plans.slice(0, 10), "暂无计划数据"),
      "",
      "## 三、项目进展",
      ...toBulletLines(input.projects.slice(0, 6), "暂无项目数据"),
      "",
      "## 四、知识与经验沉淀",
      ...toBulletLines(input.knowledge.slice(0, 8), "暂无知识库数据"),
      "",
      "## 五、下阶段建议",
      ...buildSuggestions(stats.highPlanCount, stats.activePlanCount, stats.knowledgeCount),
    ].join("\n"),
  }
}

export function buildReportDocumentHtml(report: BuiltReport, input: ReportInput, now = new Date()): string {
  const dateText = now.toLocaleDateString("zh-CN")
  const timeText = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  const planItems = input.plans.slice(0, 10)
  const knowledgeItems = input.knowledge.slice(0, 8)
  const projectItems = input.projects.slice(0, 6)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; color: #1f2937; line-height: 1.85; padding: 42px 58px; }
    h1 { text-align: center; font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 17px; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #d1d5db; }
    p { font-size: 14px; margin: 6px 0; }
    ul { margin: 8px 0 0 0; padding-left: 22px; }
    li { font-size: 14px; margin: 5px 0; }
    .meta { text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 24px; }
    .summary { background: #f8fafc; border: 1px solid #e5e7eb; padding: 14px 18px; margin: 18px 0 22px; }
    .label { color: #6b7280; }
    .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.label)}报告</h1>
  <p class="meta">生成时间：${escapeHtml(dateText)} ${escapeHtml(timeText)} | XMZ OS</p>

  <div class="summary">
    <p><strong>本期概览</strong></p>
    <p><span class="label">项目数：</span>${report.stats.projectCount}</p>
    <p><span class="label">工作计划：</span>${report.stats.planCount} 个，其中未完成 ${report.stats.activePlanCount} 个，已完成 ${report.stats.donePlanCount} 个</p>
    <p><span class="label">重要事项：</span>${report.stats.highPlanCount} 个</p>
    <p><span class="label">知识沉淀：</span>${report.stats.knowledgeCount} 篇，Prompt 模板 ${report.stats.promptCount} 条，灵感 ${report.stats.ideaCount} 条</p>
  </div>

  <h2>一、重点计划</h2>
  ${renderHtmlList(planItems, "暂无计划数据")}

  <h2>二、项目进展</h2>
  ${renderHtmlList(projectItems, "暂无项目数据")}

  <h2>三、知识与经验沉淀</h2>
  ${renderHtmlList(knowledgeItems, "暂无知识库数据")}

  <h2>四、下阶段建议</h2>
  <ul>
    ${buildSuggestions(report.stats.highPlanCount, report.stats.activePlanCount, report.stats.knowledgeCount)
      .map((item) => `<li>${escapeHtml(item.replace(/^- /, ""))}</li>`)
      .join("\n    ")}
  </ul>

  <p class="footer">由 XMZ OS 自动生成，导出为 Word 可打开的文档格式。</p>
</body>
</html>`
}

function isDone(status?: string | null): boolean {
  return status === "已完成" || status === "已上线" || status === "已归档"
}

function toBulletLines(items: ReportItem[], emptyText: string): string[] {
  if (items.length === 0) return [`- ${emptyText}`]
  return items.map((item) => {
    const name = item.title || item.name || "未命名"
    const status = item.status ? `（${item.status}）` : ""
    return `- ${name}${status}`
  })
}

function renderHtmlList(items: ReportItem[], emptyText: string): string {
  const source = items.length === 0 ? [{ title: emptyText }] : items
  const lis = source.map((item) => {
    const name = item.title || item.name || "未命名"
    const status = item.status ? `（${item.status}）` : ""
    const extra = item.category ? ` [${item.category}]` : ""
    return `<li><strong>${escapeHtml(name)}</strong>${escapeHtml(status + extra)}</li>`
  })
  return `<ul>\n    ${lis.join("\n    ")}\n  </ul>`
}

function buildSuggestions(highPlanCount: number, activePlanCount: number, knowledgeCount: number): string[] {
  const suggestions: string[] = []
  if (highPlanCount > 0) suggestions.push("- 先处理重要事项，避免阻塞项目推进。")
  if (activePlanCount > 5) suggestions.push("- 当前未完成事项较多，建议做一次范围收敛。")
  if (knowledgeCount === 0) suggestions.push("- 本期缺少知识沉淀，建议补一篇复盘或接口说明。")
  if (suggestions.length === 0) suggestions.push("- 当前节奏正常，继续保持计划、复盘和知识入库的闭环。")
  return suggestions
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

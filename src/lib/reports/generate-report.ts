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
  due_date?: string | null
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
  kind: ReportKind
  period: ReportPeriod
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

export type ReportPeriod = {
  startKey: string
  endKey: string
  label: string
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
  const period = getReportPeriod(kind, now)
  const title = `${period.label} ${label}`
  const scopedInput = filterReportInput(input, period)
  const activePlans = scopedInput.plans.filter((plan) => !isDone(plan.status))
  const donePlans = scopedInput.plans.filter((plan) => isDone(plan.status))
  const highPlans = scopedInput.plans.filter((plan) => plan.priority === "high")

  const stats = {
    projectCount: scopedInput.projects.length,
    planCount: scopedInput.plans.length,
    activePlanCount: activePlans.length,
    donePlanCount: donePlans.length,
    knowledgeCount: scopedInput.knowledge.length,
    promptCount: scopedInput.prompts.length,
    ideaCount: scopedInput.ideas.length,
    highPlanCount: highPlans.length,
  }

  return {
    title,
    label,
    kind,
    period,
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
      ...toBulletLines(scopedInput.plans.slice(0, 10), "暂无计划数据"),
      "",
      "## 三、项目进展",
      ...toBulletLines(scopedInput.projects.slice(0, 6), "暂无项目数据"),
      "",
      "## 四、知识与经验沉淀",
      ...toBulletLines(scopedInput.knowledge.slice(0, 8), "暂无知识库数据"),
      "",
      "## 五、下阶段建议",
      ...buildSuggestions(stats.highPlanCount, stats.activePlanCount, stats.knowledgeCount),
    ].join("\n"),
  }
}

export function buildReportDocumentHtml(report: BuiltReport, input: ReportInput, now = new Date()): string {
  const dateText = now.toLocaleDateString("zh-CN")
  const timeText = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  const scopedInput = filterReportInput(input, report.period)
  const planItems = scopedInput.plans.slice(0, 10)
  const knowledgeItems = scopedInput.knowledge.slice(0, 8)
  const projectItems = scopedInput.projects.slice(0, 6)

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
  <p class="meta">统计期间：${escapeHtml(report.period.label)} | 生成时间：${escapeHtml(dateText)} ${escapeHtml(timeText)} | XMZ OS</p>

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

export function getReportPeriod(kind: ReportKind, now = new Date()): ReportPeriod {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)

  if (kind === "daily") {
    const key = toDateKey(date)
    return { startKey: key, endKey: key, label: key }
  }

  if (kind === "weekly") {
    const start = new Date(date)
    const day = start.getDay()
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { startKey: toDateKey(start), endKey: toDateKey(end), label: `${toDateKey(start)} 至 ${toDateKey(end)}` }
  }

  if (kind === "monthly") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { startKey: toDateKey(start), endKey: toDateKey(end), label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` }
  }

  const start = new Date(date.getFullYear(), 0, 1)
  const end = new Date(date.getFullYear(), 11, 31)
  return { startKey: toDateKey(start), endKey: toDateKey(end), label: String(date.getFullYear()) }
}

function filterReportInput(input: ReportInput, period: ReportPeriod): ReportInput {
  return {
    projects: input.projects.filter((item) => isItemInPeriod(item, period, ["updated_at", "created_at"])),
    plans: input.plans.filter((item) => isItemInPeriod(item, period, ["due_date", "updated_at", "created_at"])),
    knowledge: input.knowledge.filter((item) => isItemInPeriod(item, period, ["updated_at", "created_at"])),
    prompts: input.prompts.filter((item) => isItemInPeriod(item, period, ["updated_at", "created_at"])),
    ideas: input.ideas.filter((item) => isItemInPeriod(item, period, ["updated_at", "created_at"])),
  }
}

function isItemInPeriod(item: ReportItem, period: ReportPeriod, fields: Array<keyof ReportItem>): boolean {
  let hasDate = false

  for (const field of fields) {
    const key = getDateKeyFromValue(item[field])
    if (!key) continue
    hasDate = true
    if (key >= period.startKey && key <= period.endKey) return true
  }

  return !hasDate
}

function getDateKeyFromValue(value: unknown): string {
  if (typeof value !== "string" || !value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return toDateKey(date)
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isDone(status?: string | null): boolean {
  return status === "已完成" || status === "已上线" || status === "已归档" || status === "已拒绝" || status === "已取消" || status === "已修复" || status === "无法重现"
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
  if (highPlanCount > 0) suggestions.push("- 先处理本期重要计划，避免阻塞项目推进。")
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

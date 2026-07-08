export type ReportKind = "daily" | "weekly" | "monthly" | "yearly"

export interface ReportItem {
  id?: string
  title?: string | null
  name?: string | null
  status?: string | null
  priority?: string | null
  type?: string | null
  category?: string | null
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

const reportLabels: Record<ReportKind, string> = {
  daily: "日报",
  weekly: "周报",
  monthly: "月报",
  yearly: "年报",
}

export function getReportLabel(kind: ReportKind): string {
  return reportLabels[kind]
}

export function buildReport(kind: ReportKind, input: ReportInput, now = new Date()) {
  const label = getReportLabel(kind)
  const title = `${now.toLocaleDateString("zh-CN")} ${label}`
  const activePlans = input.plans.filter((plan) => !isDone(plan.status))
  const donePlans = input.plans.filter((plan) => isDone(plan.status))
  const highPlans = input.plans.filter((plan) => plan.priority === "high")

  return {
    title,
    stats: {
      projectCount: input.projects.length,
      planCount: input.plans.length,
      activePlanCount: activePlans.length,
      donePlanCount: donePlans.length,
      knowledgeCount: input.knowledge.length,
      promptCount: input.prompts.length,
      ideaCount: input.ideas.length,
      highPlanCount: highPlans.length,
    },
    content: [
      `# ${title}`,
      "",
      "## 一、本期概览",
      `- 项目数：${input.projects.length}`,
      `- 工作计划：${input.plans.length} 个，其中进行中 ${activePlans.length} 个，已完成 ${donePlans.length} 个`,
      `- 高优先级事项：${highPlans.length} 个`,
      `- 知识沉淀：${input.knowledge.length} 篇，Prompt 模板：${input.prompts.length} 条，灵感：${input.ideas.length} 条`,
      "",
      "## 二、重点计划",
      ...toBulletLines(input.plans.slice(0, 8), "暂无计划数据"),
      "",
      "## 三、知识与经验沉淀",
      ...toBulletLines(input.knowledge.slice(0, 6), "暂无知识库数据"),
      "",
      "## 四、下阶段建议",
      ...buildSuggestions(highPlans.length, activePlans.length, input.knowledge.length),
    ].join("\n"),
  }
}

function isDone(status?: string | null): boolean {
  return status === "已完成" || status === "已上线" || status === "已归档"
}

function toBulletLines(items: ReportItem[], emptyText: string): string[] {
  if (items.length === 0) return [`- ${emptyText}`]
  return items.map((item) => `- ${item.title || item.name || "未命名"}${item.status ? `（${item.status}）` : ""}`)
}

function buildSuggestions(highPlanCount: number, activePlanCount: number, knowledgeCount: number): string[] {
  const suggestions: string[] = []
  if (highPlanCount > 0) suggestions.push("- 先处理高优先级事项，避免阻塞项目推进。")
  if (activePlanCount > 5) suggestions.push("- 当前未完成事项较多，建议做一次范围收敛。")
  if (knowledgeCount === 0) suggestions.push("- 本期缺少知识沉淀，建议补一篇复盘或接口说明。")
  if (suggestions.length === 0) suggestions.push("- 当前节奏正常，继续保持计划、复盘和知识入库的闭环。")
  return suggestions
}

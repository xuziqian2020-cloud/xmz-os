// 工作计划详情页
import Link from "next/link"
import { notFound } from "next/navigation"
import { getWorkPlan } from "@/lib/data/work-plans"

const typeLabels: Record<string, string> = { requirement: "需求", bug: "Bug", custom: "自定义" }
const priorityLabels: Record<string, string> = { high: "高", medium: "中", low: "低" }
const severityLabels: Record<string, string> = { high: "高", medium: "中", low: "低" }
const severityColors: Record<string, string> = {
  high: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
  medium: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  low: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
}

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const plan = await getWorkPlan(params.id)
  if (!plan) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{typeLabels[plan.type] || plan.type}</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${priorityLabels[plan.priority] === "高" ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950" : priorityLabels[plan.priority] === "中" ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950" : "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800"}`}>
              {priorityLabels[plan.priority] || plan.priority}
            </span>
          </div>
          <h1 className="text-lg font-semibold">{plan.title}</h1>
        </div>
        <Link href={`/plans/${plan.id}/edit`} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          编辑
        </Link>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm">
        <div><span className="text-muted-foreground">状态</span><p className="mt-0.5 font-medium">{plan.status}</p></div>
        <div><span className="text-muted-foreground">进度</span><p className="mt-0.5 font-medium">{plan.progress || 0}%</p></div>
        {plan.due_date && <div><span className="text-muted-foreground">截止日期</span><p className="mt-0.5 font-medium">{plan.due_date}</p></div>}
        {plan.start_date && <div><span className="text-muted-foreground">开始日期</span><p className="mt-0.5 font-medium">{plan.start_date}</p></div>}
      </div>

      {/* Bug 专用字段 */}
      {plan.type === "bug" && plan.bug_severity && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Bug 信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2"><span className="text-muted-foreground">严重等级：</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${severityColors[plan.bug_severity] || ""}`}>{severityLabels[plan.bug_severity] || plan.bug_severity}</span>
            </div>
            {plan.bug_symptom && <div><span className="text-muted-foreground">症状：</span><p className="mt-1">{plan.bug_symptom}</p></div>}
            {plan.bug_reason && <div><span className="text-muted-foreground">原因：</span><p className="mt-1">{plan.bug_reason}</p></div>}
            {plan.bug_solution && <div><span className="text-muted-foreground">解决方案：</span><p className="mt-1">{plan.bug_solution}</p></div>}
          </div>
        </div>
      )}

      {/* 需求专用字段 */}
      {plan.type === "requirement" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">需求信息</h3>
          <div className="space-y-2 text-sm">
            {plan.source_person && <div><span className="text-muted-foreground">来源：</span> {plan.source_person}</div>}
            {plan.requirement_background && <div><span className="text-muted-foreground">背景：</span><p className="mt-1">{plan.requirement_background}</p></div>}
            {plan.acceptance_criteria && <div><span className="text-muted-foreground">验收标准：</span><p className="mt-1">{plan.acceptance_criteria}</p></div>}
          </div>
        </div>
      )}

      {/* 描述 */}
      {plan.description && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">描述</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.description}</p>
        </div>
      )}
    </div>
  )
}

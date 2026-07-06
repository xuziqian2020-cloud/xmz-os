// 工作计划列表页 — 支持演示模式
import Link from "next/link"

const typeLabels: Record<string, string> = { requirement: "需求", bug: "Bug", custom: "自定义" }
const typeColors: Record<string, string> = {
  requirement: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  bug: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  custom: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export default async function PlansPage() {
  let plans: any[] = []
  try {
    const { getWorkPlans } = await import("@/lib/data/work-plans")
    plans = await getWorkPlans()
  } catch { plans = [] }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">工作计划</h1><p className="mt-1 text-sm text-muted-foreground">管理需求、Bug 和自定义计划</p></div>
        <Link href="/plans/new" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">+ 新建计划</Link>
      </div>
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无工作计划</p>
          <Link href="/plans/new" className="mt-3 text-sm text-primary hover:underline">创建第一个计划</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/10 hover:bg-secondary/30">
              <div className={`h-2.5 w-2.5 rounded-full ${plan.priority === "high" ? "bg-red-400" : plan.priority === "medium" ? "bg-amber-400" : "bg-slate-300"}`} />
              <span className="flex-1 truncate text-sm">{plan.title}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${typeColors[plan.type] || ""}`}>{typeLabels[plan.type] || plan.type}</span>
              <span className="text-xs text-muted-foreground">{plan.status}</span>
              {plan.due_date && <span className="text-xs text-muted-foreground">{plan.due_date}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

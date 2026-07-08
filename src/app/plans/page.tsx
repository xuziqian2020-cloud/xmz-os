import Link from "next/link"

const typeLabels: Record<string, string> = { requirement: "需求", bug: "Bug", custom: "自定义" }
const typeColors: Record<string, string> = {
  requirement: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  bug: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  custom: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export default async function PlansPage() {
  let plans: any[] = []
  try {
    const { getWorkPlans } = await import("@/lib/data/work-plans")
    plans = await getWorkPlans()
  } catch {
    plans = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">工作计划</h1>
          <p className="mt-2 text-base text-muted-foreground">管理需求、Bug 和自定义计划，状态统一为重要、中等、低。</p>
        </div>
        <Link href="/plans/new" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
          + 新建计划
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-base font-medium">暂无工作计划</p>
          <Link href="/plans/new" className="mt-3 text-sm text-primary hover:underline">创建第一个计划</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/20 hover:bg-secondary/40">
              <div className={`h-2.5 w-2.5 rounded-full ${plan.priority === "high" ? "bg-red-400" : plan.priority === "medium" ? "bg-amber-400" : "bg-slate-300"}`} />
              <span className="flex-1 truncate text-base font-medium">{plan.title}</span>
              <span className={`rounded-md px-2 py-1 text-xs font-medium ${typeColors[plan.type] || ""}`}>{typeLabels[plan.type] || plan.type}</span>
              <span className="text-sm text-muted-foreground">{normalizeVisibleStatus(plan.status, plan.priority)}</span>
              {plan.due_date && <span className="text-sm text-muted-foreground">{plan.due_date}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function normalizeVisibleStatus(status?: string | null, priority?: string | null) {
  if (status === "重要" || status === "中等" || status === "低") return status
  if (priority === "high") return "重要"
  if (priority === "low") return "低"
  return "中等"
}

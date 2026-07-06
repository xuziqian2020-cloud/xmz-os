// 小美 AI 研发秘书独立页面
const typeLabels: Record<string, string> = { bug_severe: "严重Bug", plan_overdue: "逾期计划", weekly_candidate: "周报候选", custom: "提醒" }

export default async function AISecretaryPage() {
  let reminders: any[] = []
  try {
    const { getActiveReminders } = await import("@/lib/data/dashboard")
    reminders = await getActiveReminders()
  } catch { reminders = [] }

  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-semibold">小美 · AI 研发秘书</h1><p className="mt-1 text-sm text-muted-foreground">智能管理提醒，帮助你保持研发节奏</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {["bug_severe", "plan_overdue", "weekly_candidate"].map(type => {
          const count = reminders.filter(r => r.reminder_type === type).length
          const icons: Record<string, string> = { bug_severe: "🔴", plan_overdue: "⚠️", weekly_candidate: "📝" }
          return <div key={type} className="rounded-lg border border-border bg-card p-4 text-center">
            <span className="text-2xl">{icons[type] || "📌"}</span>
            <p className="mt-1 text-2xl font-semibold">{count}</p>
            <p className="text-xs text-muted-foreground">{typeLabels[type] || type}</p>
          </div>
        })}
      </div>
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <span className="text-4xl mb-3">🤖</span>
          <p className="text-sm text-muted-foreground">暂无提醒，一切运行良好</p>
          <p className="mt-1 text-xs text-muted-foreground/60">小美会持续监控你的项目状态</p>
        </div>
      ) : (
        <div className="space-y-2">{reminders.map(r => (
          <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <span className="mt-0.5 text-xs">{r.reminder_type === "bug_severe" ? "🔴" : r.reminder_type === "plan_overdue" ? "⚠️" : "📝"}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.title}</p>
              {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
              <span className="mt-1 inline-block text-[11px] text-muted-foreground">{typeLabels[r.reminder_type] || r.reminder_type} · {new Date(r.created_at).toLocaleDateString("zh-CN")}</span>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}

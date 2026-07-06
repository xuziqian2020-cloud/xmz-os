// Bug 库页
import Link from "next/link"

const severityLabels: Record<string, string> = { high: "高", medium: "中", low: "低" }
const severityColors: Record<string, string> = {
  high: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
  medium: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  low: "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
}

export default async function BugsPage() {
  let bugs: any[] = []
  try {
    const { getWorkPlans } = await import("@/lib/data/work-plans")
    bugs = await getWorkPlans({ type: "bug" })
  } catch { bugs = [] }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">Bug 库</h1><p className="mt-1 text-sm text-muted-foreground">查看和管理所有 Bug</p></div>
        <Link href="/plans/new?type=bug" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">+ 报告 Bug</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["high", "medium", "low"].map(sev => {
          const count = bugs.filter(b => b.bug_severity === sev).length
          return <div key={sev} className="rounded-lg border border-border bg-card p-3 text-center">
            <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium mb-1 ${severityColors[sev]}`}>{severityLabels[sev]}</span>
            <p className="text-2xl font-semibold">{count}</p>
          </div>
        })}
      </div>
      {bugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无 Bug 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">{bugs.map(bug => (
          <Link key={bug.id} href={`/plans/${bug.id}`} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/10 hover:bg-secondary/30">
            <div className={`h-2.5 w-2.5 rounded-full ${bug.bug_severity === "high" ? "bg-red-500" : bug.bug_severity === "medium" ? "bg-amber-500" : "bg-slate-400"}`} />
            <span className="flex-1 truncate text-sm">{bug.title}</span>
            <span className="text-xs text-muted-foreground">{bug.status}</span>
          </Link>
        ))}</div>
      )}
    </div>
  )
}

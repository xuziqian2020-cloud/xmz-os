// 报表总结页
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-semibold">报表总结</h1><p className="mt-1 text-sm text-muted-foreground">周报、月报、项目总结和 Bug 复盘</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["周报", "月报", "年报", "项目总结", "Bug 复盘"].map(t => (
          <div key={t} className="rounded-lg border border-border bg-card p-5 hover:border-primary/20 cursor-pointer">
            <h3 className="text-sm font-medium">{t}</h3>
            <p className="mt-1 text-xs text-muted-foreground">AI 自动生成总结，即将上线</p>
          </div>
        ))}
      </div>
    </div>
  )
}

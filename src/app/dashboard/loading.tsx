// 工作台加载状态
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 欢迎区域 */}
      <section className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-secondary" />
          <div className="h-4 w-48 rounded bg-secondary" />
        </div>
        <div className="h-4 w-36 rounded bg-secondary" />
      </section>

      {/* 小美提醒 */}
      <section>
        <div className="mb-3 h-5 w-40 rounded bg-secondary" />
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-md bg-secondary/50" />
          ))}
        </div>
      </section>

      {/* 今日计划 */}
      <section>
        <div className="mb-3 h-5 w-24 rounded bg-secondary" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg border border-border bg-card" />
          ))}
        </div>
      </section>

      {/* 快捷操作 */}
      <section>
        <div className="mb-3 h-5 w-24 rounded bg-secondary" />
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg border border-border bg-card" />
          ))}
        </div>
      </section>
    </div>
  )
}

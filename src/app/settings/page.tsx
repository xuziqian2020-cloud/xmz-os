// 系统设置页
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-lg font-semibold">设置</h1><p className="mt-1 text-sm text-muted-foreground">系统偏好设置</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <a href="/ai-settings" className="rounded-lg border border-border bg-card p-5 hover:border-primary/20">
          <h3 className="text-sm font-medium">AI 设置</h3>
          <p className="mt-1 text-xs text-muted-foreground">配置 AI 供应商和 API Key</p>
        </a>
        <div className="rounded-lg border border-border bg-card p-5 opacity-50">
          <h3 className="text-sm font-medium">通知设置</h3>
          <p className="mt-1 text-xs text-muted-foreground">即将上线</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 opacity-50">
          <h3 className="text-sm font-medium">备份与导出</h3>
          <p className="mt-1 text-xs text-muted-foreground">即将上线</p>
        </div>
      </div>
    </div>
  )
}

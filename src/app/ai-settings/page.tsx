// AI 设置页 — 供应商配置
"use client"
import { useState, useEffect } from "react"

export default function AISettingsPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ai-providers").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setProviders(d)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">AI 设置</h1><p className="mt-1 text-sm text-muted-foreground">管理 AI 供应商和 API Key</p></div>
        <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 添加供应商</button>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">暂无 AI 供应商配置</p>
          <p className="mt-1 text-xs text-muted-foreground/60">添加 OpenAI、Claude、DeepSeek 等供应商以获得 AI 能力</p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map(p => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{p.provider_name}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{p.provider_type}</span>
                  {p.default_model && <span className="text-xs text-muted-foreground">默认：{p.default_model}</span>}
                </div>
                <span className={`text-xs ${p.is_enabled ? "text-green-600" : "text-red-500"}`}>{p.is_enabled ? "已启用" : "已禁用"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

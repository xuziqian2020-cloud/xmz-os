// 业务流程图模块 — Mermaid 编辑 + 预览
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function ProcessPage() {
  const [diagrams, setDiagrams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/diagrams").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDiagrams(d)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">业务流程图</h1><p className="mt-1 text-sm text-muted-foreground">Mermaid 流程图管理</p></div>
        <Link href="/process/new" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 新建流程图</Link>
      </div>

      {diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无流程图</p>
          <Link href="/process/new" className="mt-3 text-sm text-primary hover:underline">创建第一个流程图</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diagrams.map(d => (
            <Link key={d.id} href={`/process/${d.id}`} className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <h3 className="text-sm font-medium">{d.title}</h3>
              {d.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                {d.process_type && <span className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">{d.process_type}</span>}
                <span className="text-[10px] text-muted-foreground">{new Date(d.updated_at).toLocaleDateString("zh-CN")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

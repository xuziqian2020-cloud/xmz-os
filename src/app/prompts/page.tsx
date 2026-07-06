// Prompt 库
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sceneFilter, setSceneFilter] = useState("")

  useEffect(() => {
    fetch("/api/prompts").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setPrompts(d)
    }).finally(() => setLoading(false))
  }, [])

  const scenes = Array.from(new Set(prompts.map(p => p.scene).filter(Boolean))) as string[]

  const filtered = prompts.filter(p => {
    if (search && !p.title.includes(search) && !p.content.includes(search)) return false
    if (sceneFilter && p.scene !== sceneFilter) return false
    return true
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">Prompt 库</h1><p className="mt-1 text-sm text-muted-foreground">管理和收藏 Prompt 模板</p></div>
        <Link href="/prompts/new" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 新建 Prompt</Link>
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 Prompt..." className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
        {scenes.length > 0 && (
          <select value={sceneFilter} onChange={e => setSceneFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
            <option value="">全部场景</option>
            {scenes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无 Prompt</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">{p.title}</h3>
                  <div className="mt-1 flex gap-2">
                    {p.scene && <span className="text-[11px] text-muted-foreground bg-secondary/50 rounded px-1.5 py-0.5">{p.scene}</span>}
                    {p.model_scope && <span className="text-[11px] text-muted-foreground bg-secondary/50 rounded px-1.5 py-0.5">{p.model_scope}</span>}
                    {p.version && <span className="text-[11px] text-muted-foreground">v{p.version}</span>}
                  </div>
                </div>
                <button onClick={() => copyToClipboard(p.content)} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">复制</button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded bg-secondary/50 p-3 text-xs leading-relaxed whitespace-pre-wrap">{p.content}</pre>
              {p.tags && p.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.map((t: string) => <span key={t} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

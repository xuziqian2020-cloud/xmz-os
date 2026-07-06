// 灵感箱
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const categoryColors: Record<string, string> = {
  "功能想法": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "优化想法": "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  "AI想法": "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  "业务想法": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "技术想法": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}
const statusColors: Record<string, string> = {
  "未整理": "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
  "已采纳": "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  "已放弃": "text-slate-400 bg-slate-50 dark:text-slate-500 dark:bg-slate-800",
  "已转计划": "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
  "已转知识库": "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState("")

  useEffect(() => {
    fetch("/api/ideas").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setIdeas(d)
    }).finally(() => setLoading(false))
  }, [])

  const categories = Array.from(new Set(ideas.map(i => i.category).filter(Boolean))) as string[]
  const filtered = catFilter ? ideas.filter(i => i.category === catFilter) : ideas

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/ideas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">灵感箱</h1><p className="mt-1 text-sm text-muted-foreground">记录和管理灵感想法</p></div>
        <Link href="/ideas/new" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 新增灵感</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCatFilter("")} className={`rounded-full px-3 py-1 text-xs transition-colors ${!catFilter ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>全部</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`rounded-full px-3 py-1 text-xs transition-colors ${catFilter === c ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无灵感</p>
          <Link href="/ideas/new" className="mt-3 text-sm text-primary hover:underline">记录第一个灵感</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(idea => (
            <div key={idea.id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">{idea.title}</h3>
                  {idea.content && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{idea.content}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {idea.category && <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${categoryColors[idea.category] || ""}`}>{idea.category}</span>}
                  <select value={idea.status} onChange={e => updateStatus(idea.id, e.target.value)}
                    className={`rounded border-0 px-1.5 py-0.5 text-[11px] font-medium outline-none cursor-pointer ${statusColors[idea.status] || ""}`}>
                    {["未整理", "已采纳", "已放弃", "已转计划", "已转知识库"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(idea.created_at).toLocaleDateString("zh-CN")}</span>
                <Link href={`/ideas/${idea.id}/edit`} className="hover:text-foreground">编辑</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

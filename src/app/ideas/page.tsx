"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { DeleteButton } from "@/components/common/delete-button"

const categoryColors: Record<string, string> = {
  "功能想法": "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "优化想法": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "AI想法": "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  "业务想法": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "技术想法": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

const statusColors: Record<string, string> = {
  "未整理": "bg-slate-100 text-slate-600",
  "已采纳": "bg-emerald-50 text-emerald-700",
  "已放弃": "bg-red-50 text-red-700",
  "已转计划": "bg-blue-50 text-blue-700",
  "已转知识库": "bg-purple-50 text-purple-700",
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState("")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch("/api/ideas").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setIdeas(d)
    }).finally(() => setLoading(false))
  }, [])

  const categories = Array.from(new Set(ideas.map(i => i.category).filter(Boolean))) as string[]
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return ideas.filter((idea) => {
      if (catFilter && idea.category !== catFilter) return false
      if (!keyword) return true
      const text = [idea.title, idea.content, idea.category, idea.status].join(" ").toLowerCase()
      return text.includes(keyword)
    })
  }, [ideas, catFilter, search])

  const allSelected = filtered.length > 0 && filtered.every((idea) => selectedIds.includes(idea.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filtered.map((idea) => idea.id))
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/ideas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 条灵感吗？`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    try {
      for (const id of ids) {
        await fetch(`/api/ideas/${id}`, { method: "DELETE" })
      }
      setIdeas((prev) => prev.filter((idea) => !ids.includes(idea.id)))
      setSelectedIds([])
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold">灵感箱</h1><p className="mt-1 text-sm text-muted-foreground">记录和管理灵感想法</p></div>
        <Link href="/ideas/new" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 新增灵感</Link>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="查询灵感标题、内容、分类或状态..."
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCatFilter("")} className={`rounded-full px-3 py-1 text-xs transition-colors ${!catFilter ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>全部</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`rounded-full px-3 py-1 text-xs transition-colors ${catFilter === c ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filtered.length}
        allSelected={allSelected}
        deleting={deleting}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无灵感</p>
          <Link href="/ideas/new" className="mt-3 text-sm text-primary hover:underline">记录第一个灵感</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(idea => (
            <div key={idea.id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(idea.id)}
                    onChange={() => toggleSelection(idea.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{idea.title}</h3>
                    {idea.content && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.content}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {idea.category && <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${categoryColors[idea.category] || ""}`}>{idea.category}</span>}
                  <select value={idea.status} onChange={e => updateStatus(idea.id, e.target.value)}
                    className={`cursor-pointer rounded border-0 px-1.5 py-0.5 text-[11px] font-medium outline-none ${statusColors[idea.status] || ""}`}>
                    {["未整理", "已采纳", "已放弃", "已转计划", "已转知识库"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(idea.created_at).toLocaleDateString("zh-CN")}</span>
                <Link href={`/ideas/${idea.id}/edit`} className="hover:text-foreground">编辑</Link>
                <DeleteButton endpoint={`/api/ideas/${idea.id}`} confirmText={`确定删除灵感「${idea.title}」吗？`} onDeleted={() => setIdeas(prev => prev.filter(item => item.id !== idea.id))} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

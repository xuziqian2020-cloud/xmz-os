"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"

const LOCAL_PROMPTS_KEY = "xmz-os-local-prompts"

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sceneFilter, setSceneFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch("/api/prompts").then(r => r.json()).then(d => {
      const localPrompts = readLocalPrompts()
      if (Array.isArray(d)) setPrompts([...localPrompts, ...d])
      else setPrompts(localPrompts)
    }).finally(() => setLoading(false))
  }, [])

  const scenes = Array.from(new Set(prompts.map(p => p.scene).filter(Boolean))) as string[]

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return prompts.filter(p => {
      if (keyword && !matchesPrompt(p, keyword)) return false
      if (sceneFilter && p.scene !== sceneFilter) return false
      return true
    })
  }, [prompts, search, sceneFilter])

  const allSelected = filtered.length > 0 && filtered.every((prompt) => selectedIds.includes(prompt.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filtered.map((prompt) => prompt.id))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const deletePrompt = async (prompt: any) => {
    if (!window.confirm(`确定删除 Prompt「${prompt.title}」吗？`)) return

    if (String(prompt.id).startsWith("local-")) {
      deleteLocalPrompt(prompt.id)
      setPrompts(prev => prev.filter(item => item.id !== prompt.id))
      return
    }

    const res = await fetch(`/api/prompts/${prompt.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      window.alert(data.error || "删除失败")
      return
    }
    setPrompts(prev => prev.filter(item => item.id !== prompt.id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 个 Prompt 吗？`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    try {
      const localIds: string[] = []
      const serverIds: string[] = []
      for (const id of ids) {
        if (String(id).startsWith("local-")) localIds.push(id)
        else serverIds.push(id)
      }

      if (localIds.length > 0) deleteLocalPrompts(localIds)
      for (const id of serverIds) {
        await fetch(`/api/prompts/${id}`, { method: "DELETE" })
      }

      setPrompts((prev) => prev.filter((prompt) => !ids.includes(prompt.id)))
      setSelectedIds([])
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold">Prompt 库</h1><p className="mt-1 text-sm text-muted-foreground">管理和收藏 Prompt 模板</p></div>
        <Link href="/prompts/new" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 新建 Prompt</Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="查询 Prompt 标题、内容、标签..." className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30" />
        {scenes.length > 0 && (
          <select value={sceneFilter} onChange={e => setSceneFilter(e.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="">全部场景</option>
            {scenes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
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
          <p className="text-sm text-muted-foreground">暂无 Prompt</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelection(p.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{p.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {p.scene && <span className="rounded bg-secondary/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">{p.scene}</span>}
                      {p.model_scope && <span className="rounded bg-secondary/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">{p.model_scope}</span>}
                      {p.version && <span className="text-[11px] text-muted-foreground">v{p.version}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => copyToClipboard(p.content)} className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">复制</button>
                  <button onClick={() => deletePrompt(p)} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-secondary/50 p-3 text-xs leading-relaxed">{p.content}</pre>
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

function matchesPrompt(prompt: any, keyword: string): boolean {
  const text = [
    prompt.title,
    prompt.content,
    prompt.scene,
    prompt.model_scope,
    ...(prompt.tags || []),
  ].join(" ").toLowerCase()
  return text.includes(keyword)
}

function readLocalPrompts() {
  try {
    const data = window.localStorage.getItem(LOCAL_PROMPTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function deleteLocalPrompt(id: string) {
  deleteLocalPrompts([id])
}

function deleteLocalPrompts(ids: string[]) {
  try {
    const data = window.localStorage.getItem(LOCAL_PROMPTS_KEY)
    const prompts = data ? JSON.parse(data) : []
    window.localStorage.setItem(LOCAL_PROMPTS_KEY, JSON.stringify(prompts.filter((item: any) => !ids.includes(item.id))))
  } catch {
  }
}

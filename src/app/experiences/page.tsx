"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookMarked, Plus } from "lucide-react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { DeleteButton } from "@/components/common/delete-button"

const EXPERIENCE_CATEGORY = "经验库"

export default function ExperiencesPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch("/api/knowledge", { cache: "no-store" }).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDocs(d.filter((doc) => doc.category === EXPERIENCE_CATEGORY))
    }).finally(() => setLoading(false))
  }, [])

  const filteredDocs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return docs
    return docs.filter((doc) => {
      const text = [doc.title, doc.content, doc.category, ...(doc.tags || [])].join(" ").toLowerCase()
      return text.includes(keyword)
    })
  }, [docs, search])

  const allSelected = filteredDocs.length > 0 && filteredDocs.every((doc) => selectedIds.includes(doc.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredDocs.map((doc) => doc.id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 条经验吗？`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    try {
      for (const id of ids) {
        await fetch(`/api/knowledge/${id}`, { method: "DELETE" })
      }
      setDocs((prev) => prev.filter((doc) => !ids.includes(doc.id)))
      setSelectedIds([])
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Experience</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">经验库</h1>
          <p className="mt-1 text-sm text-muted-foreground">沉淀踩坑记录、上线经验、排查路径和可复用做法</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/knowledge/new?category=${encodeURIComponent(EXPERIENCE_CATEGORY)}`} className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            批量导入经验
          </Link>
          <Link href={`/knowledge/new?category=${encodeURIComponent(EXPERIENCE_CATEGORY)}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            <Plus className="h-4 w-4" />
            新增经验
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="查询经验标题、内容或标签..."
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filteredDocs.length}
        allSelected={allSelected}
        deleting={deleting}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
      />

      {filteredDocs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">暂无经验记录</p>
          <p className="mt-1 text-sm text-muted-foreground">可以先把最近一次问题处理或上线复盘录入进来。</p>
          <Link href={`/knowledge/new?category=${encodeURIComponent(EXPERIENCE_CATEGORY)}`} className="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
            创建第一条经验
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary/40">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(doc.id)}
                  onChange={() => toggleSelection(doc.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                />
                <Link href={`/knowledge/${doc.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-sm font-semibold">{doc.title}</h2>
                    <span className="rounded bg-secondary px-2 py-1 text-[11px] text-muted-foreground">经验</span>
                  </div>
                  {doc.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{doc.content}</p>}
                  {doc.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {doc.tags.map((tag: string) => <span key={tag} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}
                    </div>
                  )}
                </Link>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Link href={`/knowledge/${doc.id}/edit`} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">编辑</Link>
                <DeleteButton endpoint={`/api/knowledge/${doc.id}`} confirmText={`确定删除经验「${doc.title}」吗？`} onDeleted={() => setDocs((prev) => prev.filter((item) => item.id !== doc.id))} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

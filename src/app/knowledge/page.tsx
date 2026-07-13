"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { DeleteButton } from "@/components/common/delete-button"
import type { KnowledgeDocument } from "@/lib/database.types"

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadDocs() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/knowledge", { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "知识库加载失败")
        if (!cancelled) setDocs(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) setError(e.message || "知识库加载失败")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDocs()
    return () => { cancelled = true }
  }, [])

  const categories = useMemo(() => {
    const values = new Set<string>()
    for (const doc of docs) {
      if (doc.category) values.add(doc.category)
    }
    return Array.from(values)
  }, [docs])

  const filteredDocs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return docs.filter((doc) => {
      if (category && doc.category !== category) return false
      if (!keyword) return true
      return matchesKnowledge(doc, keyword)
    })
  }, [docs, search, category])

  const allSelected = filteredDocs.length > 0 && filteredDocs.every((doc) => selectedIds.includes(doc.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredDocs.map((doc) => doc.id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 篇文档吗？`)) return
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">知识库</h1>
          <p className="mt-1 text-sm text-muted-foreground">项目知识、Markdown 文档和经验沉淀统一管理</p>
        </div>
        <Link href="/knowledge/new" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
          + 新建文档
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="查询文档标题、内容或标签..."
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
        >
          <option value="">全部分类</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filteredDocs.length}
        allSelected={allSelected}
        deleting={deleting}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
      />

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
          正在加载知识库...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无文档</p>
          <Link href="/knowledge/new" className="mt-3 text-sm text-primary hover:underline">从本地 Markdown 创建第一篇文档</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/10 hover:bg-secondary/30">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(doc.id)}
                  onChange={() => toggleSelection(doc.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                />
                <Link href={`/knowledge/${doc.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-medium">{doc.title}</h3>
                    {doc.category && <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{doc.category}</span>}
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}
                    </div>
                  )}
                </Link>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">更新于 {new Date(doc.updated_at).toLocaleDateString("zh-CN")}</p>
                <div className="flex items-center gap-2">
                  <Link href={`/knowledge/${doc.id}/edit`} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">编辑</Link>
                  <DeleteButton endpoint={`/api/knowledge/${doc.id}`} confirmText={`确定删除文档「${doc.title}」吗？`} onDeleted={() => setDocs((prev) => prev.filter((item) => item.id !== doc.id))} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function matchesKnowledge(doc: KnowledgeDocument, keyword: string): boolean {
  const text = [
    doc.title,
    doc.content,
    doc.category,
    doc.source,
    ...(doc.tags || []),
  ].join(" ").toLowerCase()
  return text.includes(keyword)
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { DeleteButton } from "@/components/common/delete-button"

export default function ProcessPage() {
  const [diagrams, setDiagrams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch("/api/diagrams").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDiagrams(d)
    }).finally(() => setLoading(false))
  }, [])

  const filteredDiagrams = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return diagrams
    return diagrams.filter((diagram) => {
      const text = [diagram.title, diagram.description, diagram.process_type].join(" ").toLowerCase()
      return text.includes(keyword)
    })
  }, [diagrams, search])

  const allSelected = filteredDiagrams.length > 0 && filteredDiagrams.every((diagram) => selectedIds.includes(diagram.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredDiagrams.map((diagram) => diagram.id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 个流程图吗？`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    try {
      for (const id of ids) {
        await fetch(`/api/diagrams/${id}`, { method: "DELETE" })
      }
      setDiagrams((prev) => prev.filter((diagram) => !ids.includes(diagram.id)))
      setSelectedIds([])
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold">业务流程图</h1><p className="mt-1 text-sm text-muted-foreground">Mermaid 流程图管理</p></div>
        <Link href="/process/new" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">+ 新建流程图</Link>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="查询流程图标题、说明或类型..."
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filteredDiagrams.length}
        allSelected={allSelected}
        deleting={deleting}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
      />

      {filteredDiagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无流程图</p>
          <Link href="/process/new" className="mt-3 text-sm text-primary hover:underline">创建第一个流程图</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDiagrams.map((diagram) => (
            <div key={diagram.id} className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(diagram.id)}
                  onChange={() => toggleSelection(diagram.id)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <DeleteButton endpoint={`/api/diagrams/${diagram.id}`} confirmText={`确定删除流程图「${diagram.title}」吗？`} onDeleted={() => setDiagrams((prev) => prev.filter((item) => item.id !== diagram.id))} />
              </div>
              <Link href={`/process/${diagram.id}`} className="block">
                <h3 className="text-sm font-medium">{diagram.title}</h3>
                {diagram.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{diagram.description}</p>}
                <div className="mt-3 flex items-center gap-2">
                  {diagram.process_type && <span className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">{diagram.process_type}</span>}
                  <span className="text-[10px] text-muted-foreground">{new Date(diagram.updated_at).toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { DeleteButton } from "@/components/common/delete-button"
import { PlanCompletionSelect, PlanPrioritySelect } from "@/components/plans/plan-status-select"
import { getAllowedStatuses, planPriorityValues, priorityToLabel } from "@/lib/work-plans/status-rules"

const severityLabels: Record<string, string> = { high: "高", medium: "中", low: "低" }
const severityColors: Record<string, string> = {
  high: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
  medium: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  low: "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchBugs()
  }, [])

  async function fetchBugs() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/work-plans?type=bug", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Bug 库加载失败")
      setBugs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || "Bug 库加载失败")
    } finally {
      setLoading(false)
    }
  }

  const filteredBugs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return bugs
    return bugs.filter((bug) => matchesBug(bug, keyword))
  }, [bugs, search])

  const allSelected = filteredBugs.length > 0 && filteredBugs.every((bug) => selectedIds.includes(bug.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredBugs.map((bug) => bug.id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 个 Bug 吗？`)) return
    setBulkSaving(true)
    try {
      const ids = [...selectedIds]
      const res = await fetch("/api/work-plans/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "批量删除失败")
      setBugs((prev) => prev.filter((bug) => !ids.includes(bug.id)))
      setSelectedIds([])
    } catch (e: any) {
      window.alert(e.message || "批量删除失败")
    } finally {
      setBulkSaving(false)
    }
  }

  async function handleBulkPriorityUpdate(priority: string) {
    await updateSelectedBugs({ priority })
  }

  async function handleBulkStatusUpdate(status: string) {
    await updateSelectedBugs({ status })
  }

  async function updateSelectedBugs(payload: Record<string, string>) {
    if (selectedIds.length === 0) return
    setBulkSaving(true)
    try {
      const res = await fetch("/api/work-plans/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "批量更新失败")
      if (Array.isArray(data)) mergeUpdatedBugs(data)
    } catch (e: any) {
      window.alert(e.message || "批量更新失败")
    } finally {
      setBulkSaving(false)
    }
  }

  function mergeUpdatedBugs(updatedBugs: any[]) {
    setBugs((prev) => prev.map((bug) => updatedBugs.find((item) => item.id === bug.id) || bug))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold">Bug 库</h1><p className="mt-1 text-sm text-muted-foreground">查看和管理所有 Bug</p></div>
        <Link href="/plans/new?type=bug" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">+ 新建 Bug</Link>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="查询 Bug 标题、现象、原因、解决方案或状态..."
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />

      <div className="grid grid-cols-3 gap-3">
        {["high", "medium", "low"].map((sev) => {
          const count = filteredBugs.filter((bug) => (bug.bug_severity || bug.priority) === sev).length
          return <div key={sev} className="rounded-lg border border-border bg-card p-3 text-center">
            <span className={`mb-1 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${severityColors[sev]}`}>{severityLabels[sev]}</span>
            <p className="text-2xl font-semibold">{count}</p>
          </div>
        })}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filteredBugs.length}
        allSelected={allSelected}
        deleting={bulkSaving}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
      >
        <select
          defaultValue=""
          disabled={selectedIds.length === 0 || bulkSaving}
          onChange={(event) => {
            if (event.target.value) handleBulkPriorityUpdate(event.target.value)
            event.target.value = ""
          }}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none disabled:opacity-50"
        >
          <option value="">批量等级状态</option>
          {planPriorityValues.map((item) => (
            <option key={item} value={item}>{priorityToLabel(item)}</option>
          ))}
        </select>
        <select
          defaultValue=""
          disabled={selectedIds.length === 0 || bulkSaving}
          onChange={(event) => {
            if (event.target.value) handleBulkStatusUpdate(event.target.value)
            event.target.value = ""
          }}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none disabled:opacity-50"
        >
          <option value="">批量任务状态</option>
          {getAllowedStatuses("bug").map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </BulkActionBar>

      {error && <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">正在加载 Bug...</p>
        </div>
      ) : filteredBugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无 Bug</p>
        </div>
      ) : (
        <div className="space-y-2">{filteredBugs.map((bug) => (
          <div key={bug.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/10 hover:bg-secondary/30">
            <input
              type="checkbox"
              checked={selectedIds.includes(bug.id)}
              onChange={() => toggleSelection(bug.id)}
              className="h-4 w-4 shrink-0 rounded border-border"
            />
            <Link href={`/plans/${bug.id}`} className="flex min-w-0 flex-1 items-center gap-4">
              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${(bug.bug_severity || bug.priority) === "high" ? "bg-red-500" : (bug.bug_severity || bug.priority) === "medium" ? "bg-amber-500" : "bg-slate-400"}`} />
              <span className="flex-1 truncate text-sm">{bug.title}</span>
            </Link>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <PlanPrioritySelect planId={bug.id} type={bug.type} priority={bug.priority} onSaved={(updated) => mergeUpdatedBugs([updated])} />
              <PlanCompletionSelect planId={bug.id} type={bug.type} status={bug.status} progress={bug.progress} onSaved={(updated) => mergeUpdatedBugs([updated])} />
              <Link href={`/plans/${bug.id}/edit`} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">编辑</Link>
            </div>
            <DeleteButton endpoint={`/api/work-plans/${bug.id}`} confirmText={`确定删除 Bug「${bug.title}」吗？`} onDeleted={() => setBugs((prev) => prev.filter((item) => item.id !== bug.id))} />
          </div>
        ))}</div>
      )}
    </div>
  )
}

function matchesBug(bug: any, keyword: string): boolean {
  const text = [
    bug.title,
    bug.description,
    bug.status,
    bug.bug_symptom,
    bug.bug_reason,
    bug.bug_solution,
    bug.bug_error_message,
  ].join(" ").toLowerCase()
  return text.includes(keyword)
}

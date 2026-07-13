"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { DeleteButton } from "@/components/common/delete-button"
import { PlanCompletionSelect, PlanPrioritySelect } from "@/components/plans/plan-status-select"
import { getAllowedStatuses, planPriorityValues, priorityToLabel } from "@/lib/work-plans/status-rules"

const typeLabels: Record<string, string> = { requirement: "需求", bug: "Bug", custom: "自定义" }
const typeColors: Record<string, string> = {
  requirement: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  bug: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  custom: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/work-plans", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "工作计划加载失败")
      setPlans(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || "工作计划加载失败")
    } finally {
      setLoading(false)
    }
  }

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return plans
    return plans.filter((plan) => matchesPlan(plan, keyword))
  }, [plans, search])

  const allSelected = filteredPlans.length > 0 && filteredPlans.every((plan) => selectedIds.includes(plan.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredPlans.map((plan) => plan.id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 个计划吗？`)) return
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
      setPlans((prev) => prev.filter((plan) => !ids.includes(plan.id)))
      setSelectedIds([])
    } catch (e: any) {
      window.alert(e.message || "批量删除失败")
    } finally {
      setBulkSaving(false)
    }
  }

  async function handleBulkPriorityUpdate(priority: string) {
    await updateSelectedPlans({ priority })
  }

  async function handleBulkStatusUpdate(status: string) {
    await updateSelectedPlans({ status })
  }

  async function updateSelectedPlans(payload: Record<string, string>) {
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
      if (Array.isArray(data)) mergeUpdatedPlans(data)
    } catch (e: any) {
      window.alert(e.message || "批量更新失败")
    } finally {
      setBulkSaving(false)
    }
  }

  function mergeUpdatedPlans(updatedPlans: any[]) {
    setPlans((prev) => prev.map((plan) => updatedPlans.find((item) => item.id === plan.id) || plan))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">工作计划</h1>
          <p className="mt-2 text-base text-muted-foreground">管理需求、Bug 和自定义计划，可直接调整重要程度和完成状态。</p>
        </div>
        <Link href="/plans/new" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
          + 新建计划
        </Link>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="查询计划标题、说明、类型或状态..."
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filteredPlans.length}
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
          {getAllowedStatuses().map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </BulkActionBar>

      {error && <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-base font-medium">正在加载工作计划...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-base font-medium">暂无工作计划</p>
          <Link href="/plans/new" className="mt-3 text-sm text-primary hover:underline">创建第一个计划</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/20 hover:bg-secondary/40">
              <input
                type="checkbox"
                checked={selectedIds.includes(plan.id)}
                onChange={() => toggleSelection(plan.id)}
                className="h-4 w-4 shrink-0 rounded border-border"
              />
              <Link href={`/plans/${plan.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${plan.priority === "high" ? "bg-red-400" : plan.priority === "medium" ? "bg-amber-400" : "bg-slate-300"}`} />
                <span className="flex-1 truncate text-base font-medium">{plan.title}</span>
                <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${typeColors[plan.type] || ""}`}>{typeLabels[plan.type] || plan.type}</span>
                {plan.due_date && <span className="shrink-0 text-sm text-muted-foreground">{plan.due_date}</span>}
              </Link>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <PlanPrioritySelect planId={plan.id} type={plan.type} priority={plan.priority} onSaved={(updated) => mergeUpdatedPlans([updated])} />
                <PlanCompletionSelect planId={plan.id} type={plan.type} status={plan.status} progress={plan.progress} onSaved={(updated) => mergeUpdatedPlans([updated])} />
                <Link href={`/plans/${plan.id}/edit`} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">编辑</Link>
              </div>
              <DeleteButton endpoint={`/api/work-plans/${plan.id}`} confirmText={`确定删除计划「${plan.title}」吗？`} onDeleted={() => setPlans((prev) => prev.filter((item) => item.id !== plan.id))} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function matchesPlan(plan: any, keyword: string): boolean {
  const text = [
    plan.title,
    plan.description,
    plan.status,
    plan.type,
    typeLabels[plan.type],
    plan.due_date,
  ].join(" ").toLowerCase()
  return text.includes(keyword)
}

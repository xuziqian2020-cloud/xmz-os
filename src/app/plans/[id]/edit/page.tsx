// 编辑计划页（简化版 — 支持修改完成状态和描述）
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getAllowedStatuses, normalizeStatusForType } from "@/lib/work-plans/status-rules"

export default function EditPlanPage() {
  const params = useParams(); const id = params.id as string
  const router = useRouter()
  const [plan, setPlan] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const dueDateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/work-plans/${id}`).then(r => r.json()).then(d => {
      setPlan(d); setTitle(d.title || ""); setDescription(d.description || "")
      setStatus(d.status || ""); setDueDate((d.due_date || "").slice(0, 10)); setProgress(d.progress || 0)
    }).finally(() => setPageLoading(false))
  }, [id])

  useEffect(() => {
    if (!plan) return
    const next = normalizeStatusForType({ type: plan.type, status, progress })
    if (next.progress !== progress) setProgress(next.progress)
    if (next.status !== status) setStatus(next.status)
  }, [plan, status, progress])

  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch(`/api/work-plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), status, due_date: dueDate || dueDateRef.current?.value || null, progress }),
    })
    if (res.ok) { router.push(`/plans/${id}`); router.refresh() }
    setLoading(false)
  }

  if (pageLoading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>
  if (!plan) return <div className="py-20 text-center text-sm text-muted-foreground">计划不存在</div>

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div><h1 className="text-lg font-semibold">编辑计划</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">状态</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20">
            {getAllowedStatuses(plan.type).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">截止日期</label>
          <input ref={dueDateRef} type="date" value={dueDate} onInput={e => setDueDate(e.currentTarget.value)} onChange={e => setDueDate(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">进度 ({progress}%)</label>
          <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(parseInt(e.target.value))} disabled={status !== "进行中"} className="w-full disabled:opacity-45" />
          {status !== "进行中" && <p className="mt-1 text-xs text-muted-foreground">已完成自动为 100%，已拒绝自动为 0%。</p>}
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">描述</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">
          {loading ? "保存中..." : "保存"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

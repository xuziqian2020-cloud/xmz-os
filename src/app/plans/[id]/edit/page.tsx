// 编辑计划页（简化版 — 仅支持修改状态和描述）
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

const statusOptions: Record<string, string[]> = {
  requirement: ["待确认", "待开发", "开发中", "待测试", "已完成", "已上线", "已取消"],
  bug: ["待分析", "处理中", "已修复", "无法复现", "已归档"],
  custom: ["未开始", "进行中", "已完成", "已暂停", "已取消"],
}

export default function EditPlanPage() {
  const params = useParams(); const id = params.id as string
  const router = useRouter()
  const [plan, setPlan] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("")
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/work-plans/${id}`).then(r => r.json()).then(d => {
      setPlan(d); setTitle(d.title || ""); setDescription(d.description || "")
      setStatus(d.status || ""); setProgress(d.progress || 0)
    }).finally(() => setPageLoading(false))
  }, [id])

  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch(`/api/work-plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), status, progress }),
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
            {(statusOptions[plan.type] || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">进度 ({progress}%)</label>
          <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(parseInt(e.target.value))} className="w-full" />
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

// 新建工作计划页
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function NewPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetType = searchParams.get("type") || "requirement"

  const [type, setType] = useState(presetType)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [projectId, setProjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [bugSeverity, setBugSeverity] = useState("medium")
  const [sourcePerson, setSourcePerson] = useState("")
  const [requirementBg, setRequirementBg] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setProjects(d)
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!title.trim()) return
    if (!projectId) {
      setError("请先选择所属项目。没有项目时，请先创建项目。")
      return
    }
    setLoading(true)
    setError("")

    const body: any = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      project_id: projectId || undefined,
      due_date: dueDate || undefined,
    }
    if (type === "bug") { body.bug_severity = bugSeverity }
    if (type === "requirement") {
      if (sourcePerson.trim()) body.source_person = sourcePerson.trim()
      if (requirementBg.trim()) body.requirement_background = requirementBg.trim()
    }

    const res = await fetch("/api/work-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { setError((await res.json()).error || "创建失败"); setLoading(false); return }
    const plan = await res.json()
    router.push(`/plans/${plan.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div><h1 className="text-lg font-semibold">新建计划</h1><p className="mt-1 text-sm text-muted-foreground">创建需求、Bug 或自定义工作计划</p></div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        {/* 类型选择 */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">类型 *</label>
          <div className="flex gap-2">
            {[{ v: "requirement", l: "需求" }, { v: "bug", l: "Bug" }, { v: "custom", l: "自定义" }].map(o => (
              <button key={o.v} onClick={() => setType(o.v)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${type === o.v ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>{o.l}</button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入计划标题" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>

        {/* 描述 */}
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">描述</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="详细描述" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none" />
        </div>

        {/* 优先级 */}
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">优先级</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20">
            <option value="high">高</option><option value="medium">中</option><option value="low">低</option>
          </select>
        </div>

        {/* 所属项目 */}
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">所属项目 *</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20">
            <option value="">{projects.length === 0 ? "暂无项目，请先创建项目" : "请选择项目"}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* 截止日期 */}
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">截止日期</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>

        {/* Bug 专用字段 */}
        {type === "bug" && (
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">严重等级</label>
            <select value={bugSeverity} onChange={e => setBugSeverity(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20">
              <option value="high">高</option><option value="medium">中</option><option value="low">低</option>
            </select>
          </div>
        )}

        {/* 需求专用字段 */}
        {type === "requirement" && (<>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">需求来源</label>
            <input value={sourcePerson} onChange={e => setSourcePerson(e.target.value)} placeholder="谁提出的需求" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">需求背景</label>
            <textarea value={requirementBg} onChange={e => setRequirementBg(e.target.value)} rows={2} placeholder="为什么要做这个需求" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none" />
          </div>
        </>)}

        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={!title.trim() || !projectId || loading}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">
          {loading ? "创建中..." : "创建计划"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

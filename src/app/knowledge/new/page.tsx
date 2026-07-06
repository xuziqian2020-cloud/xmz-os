"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewKnowledgePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [projectId, setProjectId] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { fetch("/api/projects").then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).catch(() => {}) }, [])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(), content, category: category || undefined,
        tags: tags ? tags.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        project_id: projectId || null,
      }),
    })
    if (!res.ok) { setError((await res.json()).error || "创建失败"); setLoading(false); return }
    const doc = await res.json()
    router.push(`/knowledge/${doc.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-lg font-semibold">新建文档</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">分类</label>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="如：技术文档、会议记录" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">所属项目</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
            <option value="">不限</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="如：React, TypeScript" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">内容</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} placeholder="支持 Markdown 格式" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-y" />
        </div>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={!title.trim() || loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">
          {loading ? "创建中..." : "创建文档"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

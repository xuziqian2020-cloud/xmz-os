"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const categories = ["功能想法", "优化想法", "AI想法", "业务想法", "技术想法"]

export default function NewIdeaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetProjectId = searchParams.get("project_id") || ""
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("功能想法")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: content.trim() || null, category, project_id: presetProjectId || null }),
    })
    if (res.ok) { router.push(presetProjectId ? `/projects/${presetProjectId}/ideas` : "/ideas"); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div><h1 className="text-lg font-semibold">新增灵感</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="简短描述你的想法" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">分类</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-md px-3 py-1.5 text-xs ${category === c ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">详细内容</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="详细记录你的想法..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 resize-y" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={!title.trim() || loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">
          {loading ? "保存中..." : "保存灵感"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

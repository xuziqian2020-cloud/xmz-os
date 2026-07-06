"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function EditKnowledgePage() {
  const params = useParams(); const id = params.id as string
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/knowledge/${id}`).then(r => r.json()).then(d => {
      setTitle(d.title || ""); setContent(d.content || ""); setCategory(d.category || "")
      setTags(d.tags?.join(", ") || "")
    }).finally(() => setPageLoading(false))
  }, [id])

  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch(`/api/knowledge/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(), content, category: category || undefined,
        tags: tags ? tags.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      }),
    })
    if (res.ok) { router.push(`/knowledge/${id}`); router.refresh() }
    setLoading(false)
  }

  if (pageLoading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-lg font-semibold">编辑文档</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">分类</label>
          <input value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">内容</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={16} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-y" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">保存</button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

const categories = ["功能想法", "优化想法", "AI想法", "业务想法", "技术想法"]

export default function EditIdeaPage() {
  const params = useParams(); const id = params.id as string
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("功能想法")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ideas/${id}`).then(r => r.json()).then(d => {
      setTitle(d.title || ""); setContent(d.content || ""); setCategory(d.category || "功能想法")
    }).finally(() => setPageLoading(false))
  }, [id])

  const handleSubmit = async () => {
    setLoading(true)
    await fetch(`/api/ideas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title: title.trim(), content, category }),
    })
    router.push("/ideas"); router.refresh()
  }

  if (pageLoading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div><h1 className="text-lg font-semibold">编辑灵感</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">分类</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-md px-3 py-1.5 text-xs ${category === c ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">内容</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 resize-y" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">保存</button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

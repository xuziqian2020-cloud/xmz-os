"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const LOCAL_PROMPTS_KEY = "xmz-os-local-prompts"

export default function NewPromptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetProjectId = searchParams.get("project_id") || ""
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [scene, setScene] = useState("")
  const [modelScope, setModelScope] = useState("")
  const [tags, setTags] = useState("")
  const [projectId, setProjectId] = useState(presetProjectId)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setProjects(d)
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return
    setLoading(true)
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(), content: content.trim(),
        scene: scene || null, model_scope: modelScope || null,
        project_id: projectId || null,
        tags: tags ? tags.split(",").map(s => s.trim()).filter(Boolean) : null,
      }),
    })
    if (res.ok) { router.push(presetProjectId ? `/projects/${presetProjectId}/prompts` : "/prompts"); router.refresh() }
    else {
      const err = await res.json()
      saveLocalPrompt({
        id: `local-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        scene: scene || null,
        model_scope: modelScope || null,
        project_id: projectId || null,
        tags: tags ? tags.split(",").map(s => s.trim()).filter(Boolean) : null,
        version: "local",
        created_at: new Date().toISOString(),
      })
      setError(`${err.error || "后端保存失败"}；已先保存到浏览器本地，正式上线请补齐 Supabase 表。`)
      setTimeout(() => {
        router.push(presetProjectId ? `/projects/${presetProjectId}/prompts` : "/prompts")
        router.refresh()
      }, 900)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-lg font-semibold">新建 Prompt</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="给这个 Prompt 起个名字" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">使用场景</label>
            <input value={scene} onChange={e => setScene(e.target.value)} placeholder="如：Code Review" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">适用模型</label>
            <select value={modelScope} onChange={e => setModelScope(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
              <option value="">不限</option>
              <option value="GPT-4">GPT-4</option>
              <option value="Claude">Claude</option>
              <option value="DeepSeek">DeepSeek</option>
              <option value="Qwen">Qwen</option>
              <option value="通用">通用</option>
            </select>
          </div>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="如：开发, 调试, 文档" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">所属项目</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30">
            <option value="">不限</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prompt 内容 *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} placeholder="输入完整的 Prompt 内容..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 resize-y" />
        </div>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={!title.trim() || !content.trim() || loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">
          {loading ? "创建中..." : "创建 Prompt"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

function saveLocalPrompt(prompt: any) {
  try {
    const existing = window.localStorage.getItem(LOCAL_PROMPTS_KEY)
    const prompts = existing ? JSON.parse(existing) : []
    window.localStorage.setItem(LOCAL_PROMPTS_KEY, JSON.stringify([prompt, ...prompts]))
  } catch {
  }
}

"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function NewDiagramPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetProjectId = searchParams.get("project_id") || ""
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [mermaidContent, setMermaidContent] = useState("graph TD\n  A[开始] --> B[处理]\n  B --> C[结束]")
  const [processType, setProcessType] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !mermaidContent.trim()) return
    setLoading(true)
    const res = await fetch("/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description, mermaid_content: mermaidContent, process_type: processType || null, project_id: presetProjectId || null }),
    })
    if (res.ok) { const d = await res.json(); router.push(presetProjectId ? `/projects/${presetProjectId}/process` : `/process/${d.id}`); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-lg font-semibold">新建流程图</h1></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">描述</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30" />
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">类型</label>
            <select value={processType} onChange={e => setProcessType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
              <option value="">通用</option>
              <option value="业务流程图">业务流程图</option>
              <option value="时序图">时序图</option>
              <option value="架构图">架构图</option>
              <option value="状态图">状态图</option>
              <option value="ER图">ER图</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mermaid 代码 *</label>
            <textarea value={mermaidContent} onChange={e => setMermaidContent(e.target.value)} rows={16} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 resize-y" />
          </div>
          <button onClick={handleSubmit} disabled={!title.trim() || loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">
            {loading ? "创建中..." : "创建"}
          </button>
        </div>
        {/* 预览区 */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-medium">预览（将使用 Mermaid 渲染）</h3>
          <div className="rounded bg-secondary/30 p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">{mermaidContent}</pre>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">创建后可在详情页查看 Mermaid 渲染结果</p>
        </div>
      </div>
    </div>
  )
}

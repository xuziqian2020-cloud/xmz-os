// 编辑项目页
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function EditProjectPage() {
  const params = useParams(); const id = params.id as string
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [projectType, setProjectType] = useState("")
  const [gitUrl, setGitUrl] = useState("")
  const [status, setStatus] = useState("active")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name || "")
        setCode(data.code || "")
        setDescription(data.description || "")
        setTechStack(data.tech_stack?.join(", ") || "")
        setProjectType(data.project_type || "")
        setGitUrl(data.git_url || "")
        setStatus(data.status || "active")
      })
      .catch(() => setError("加载失败"))
      .finally(() => setPageLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError("")

    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        tech_stack: techStack ? techStack.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        project_type: projectType || undefined,
        git_url: gitUrl.trim() || undefined,
        status,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || "保存失败")
      setLoading(false)
      return
    }

    router.push(`/projects/${id}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm("确定删除此项目？所有关联数据将保留。")) return
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/projects")
      router.refresh()
    } else {
      setError("删除失败")
    }
  }

  if (pageLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold">编辑项目</h1>
        <p className="mt-1 text-sm text-muted-foreground">修改项目信息</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">项目名称 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">项目标识</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">技术栈</label>
          <input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="逗号分隔" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">状态</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20">
            <option value="active">进行中</option>
            <option value="paused">已暂停</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Git 仓库</label>
          <input value={gitUrl} onChange={(e) => setGitUrl(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">
            {loading ? "保存中..." : "保存修改"}
          </button>
          <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">取消</button>
        </div>
        <button onClick={handleDelete} className="rounded-md px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950">删除项目</button>
      </div>
    </div>
  )
}

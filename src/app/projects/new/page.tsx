// 新建项目页
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [projectType, setProjectType] = useState("")
  const [gitUrl, setGitUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError("")

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        tech_stack: techStack ? techStack.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        project_type: projectType || undefined,
        git_url: gitUrl.trim() || undefined,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || "创建失败")
      setLoading(false)
      return
    }

    const project = await res.json()
    router.push(`/projects/${project.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold">新建项目</h1>
        <p className="mt-1 text-sm text-muted-foreground">创建一个新的研发项目</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        {/* 项目名称 */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">项目名称 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入项目名称"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Code */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">项目标识</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="如 XMZ-OS（英文标识）"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">项目描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简单描述项目内容"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* 技术栈 */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">技术栈</label>
          <input
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="逗号分隔，如 React, TypeScript, Supabase"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* 项目类型 */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">项目类型</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
          >
            <option value="">不限</option>
            <option value="Web 应用">Web 应用</option>
            <option value="移动应用">移动应用</option>
            <option value="后端服务">后端服务</option>
            <option value="工具库">工具库</option>
            <option value="数据分析">数据分析</option>
            <option value="其他">其他</option>
          </select>
        </div>

        {/* Git URL */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Git 仓库</label>
          <input
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
        )}
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "创建中..." : "创建项目"}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          取消
        </button>
      </div>
    </div>
  )
}

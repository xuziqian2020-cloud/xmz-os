"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type ExtractedDocument = {
  title?: string
  source?: string
  content?: string
}

export default function NewKnowledgePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCategory = searchParams.get("category") || ""
  const presetProjectId = searchParams.get("project_id") || ""
  const fromExperience = presetCategory === "经验库"
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState(presetCategory)
  const [tags, setTags] = useState("")
  const [source, setSource] = useState("")
  const [projectId, setProjectId] = useState(presetProjectId)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [batchImporting, setBatchImporting] = useState(false)
  const [batchMessage, setBatchMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setProjects(data) })
      .catch(() => {})
  }, [])

  async function extractDocument(file: File): Promise<ExtractedDocument> {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/tools/extract-document", { method: "POST", body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "文件读取失败")
    return data
  }

  async function handleImportFile(file: File | null) {
    if (!file) return
    setImporting(true)
    setBatchMessage("")
    setError("")

    try {
      const data = await extractDocument(file)
      if (!title.trim()) setTitle(data.title || file.name)
      if (!category.trim()) setCategory(fromExperience ? "经验库" : "技术文档")
      setSource(data.source || file.name)
      setContent(data.content || "")
    } catch (e: any) {
      setError(e.message || "文件读取失败")
    } finally {
      setImporting(false)
    }
  }

  async function handleImportFiles(files: FileList | null) {
    if (!files) return
    const fileList = Array.from(files)
    if (fileList.length === 0) return
    if (fileList.length === 1) {
      await handleImportFile(fileList[0])
      return
    }

    setBatchImporting(true)
    setBatchMessage("")
    setError("")

    let successCount = 0
    const errors: string[] = []
    for (const file of fileList) {
      try {
        const data = await extractDocument(file)
        const res = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildDocumentPayload(data, file)),
        })
        if (!res.ok) {
          const failed = await res.json()
          errors.push(`${file.name}：${failed.error || "创建失败"}`)
          continue
        }
        successCount += 1
      } catch (e: any) {
        errors.push(`${file.name}：${e.message || "导入失败"}`)
      }
    }

    setBatchImporting(false)
    if (successCount > 0) {
      setBatchMessage(`已批量导入 ${successCount} 个文件`)
      router.refresh()
    }
    if (errors.length > 0) {
      setError(errors.slice(0, 3).join("；") + (errors.length > 3 ? `；还有 ${errors.length - 3} 个文件失败` : ""))
    }
  }

  function buildDocumentPayload(data: ExtractedDocument, file: File) {
    const nextCategory = category.trim() || (fromExperience ? "经验库" : "技术文档")
    return {
      title: (data.title || file.name).trim(),
      content: data.content || "",
      category: nextCategory,
      source: data.source || file.name,
      tags: tags ? tags.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
      project_id: projectId || null,
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setLoading(true)
    setError("")

    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        content,
        category: category || undefined,
        source: source || undefined,
        tags: tags ? tags.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
        project_id: projectId || null,
      }),
    })

    if (!res.ok) {
      setError((await res.json()).error || "创建失败")
      setLoading(false)
      return
    }

    const doc = await res.json()
    router.push(presetProjectId ? `/projects/${presetProjectId}/${fromExperience ? "experiences" : "knowledge"}` : fromExperience ? "/experiences" : `/knowledge/${doc.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-lg font-semibold">{fromExperience ? "新增经验" : "新建文档"}</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="rounded-lg border border-dashed border-border bg-secondary/35 p-4">
          <label className="block text-sm font-medium text-foreground">从本地文件导入</label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            支持一次选择多个 PDF、Word、表格、图片、Markdown、TXT、JSON、CSV、HTML 文件；不能抽正文的文件会保存为资料元信息。
          </p>
          <input
            type="file"
            multiple
            onChange={(event) => handleImportFiles(event.target.files)}
            className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
            disabled={importing || batchImporting}
          />
          {source && <p className="mt-2 text-xs text-muted-foreground">已读取：{source}</p>}
          {importing && <p className="mt-2 text-xs text-muted-foreground">正在解析文件...</p>}
          {batchImporting && <p className="mt-2 text-xs text-muted-foreground">正在批量导入文件...</p>}
          {batchMessage && <p className="mt-2 text-xs text-emerald-500">{batchMessage}</p>}
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标题 *</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">分类</label>
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="如：技术文档、会议记录" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">所属项目</label>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none">
            <option value="">不限</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">标签（逗号分隔）</label>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="如：React, TypeScript" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">内容</label>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={12} placeholder="支持 Markdown 格式" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-y" />
        </div>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={!title.trim() || loading || batchImporting} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40">
          {loading ? "创建中..." : fromExperience ? "创建经验" : "创建文档"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

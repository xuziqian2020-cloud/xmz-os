"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FileText, FolderUp } from "lucide-react"
import { buildKnowledgeImportPayload, type ExtractedKnowledgeDocument } from "@/lib/knowledge/import-documents"

const folderInputProps = { webkitdirectory: "", directory: "" } as any

export default function NewKnowledgePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetProjectId = searchParams.get("project_id") || ""
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
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

  async function extractDocument(file: File): Promise<ExtractedKnowledgeDocument> {
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
      if (!category.trim()) setCategory("技术文档")
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
    const isBatchImport = fileList.length > 1 || fileList.some((file) => Boolean(file.webkitRelativePath))
    if (!isBatchImport) {
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
          body: JSON.stringify(buildKnowledgeImportPayload(data, file)),
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
      resetManualForm()
      router.refresh()
    }
    if (errors.length > 0) {
      setError(errors.slice(0, 3).join("；") + (errors.length > 3 ? `；还有 ${errors.length - 3} 个文件失败` : ""))
    }
  }

  /** XMZADD 20260720 清空批量导入前的手工字段，防止用户误建额外记录。 */
  function resetManualForm() {
    setTitle("")
    setContent("")
    setCategory("")
    setTags("")
    setSource("")
    setProjectId("")
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
    router.push(presetProjectId ? `/projects/${presetProjectId}/knowledge` : `/knowledge/${doc.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-lg font-semibold">新建文档</h1></div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="rounded-lg border border-dashed border-border bg-secondary/35 p-4">
          <label className="block text-sm font-medium text-foreground">从本地文件或文件夹导入</label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            多文件或文件夹会自动按文件创建记录：标题使用文件名，分类为技术文档，所属项目为不限。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
              <FileText className="h-4 w-4" />
              选择文件
              <input type="file" multiple onChange={(event) => handleImportFiles(event.target.files)} className="hidden" disabled={importing || batchImporting} />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
              <FolderUp className="h-4 w-4" />
              选择文件夹
              <input type="file" multiple {...folderInputProps} onChange={(event) => handleImportFiles(event.target.files)} className="hidden" disabled={importing || batchImporting} />
            </label>
          </div>
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
          {loading ? "创建中..." : "创建文档"}
        </button>
        <button onClick={() => router.back()} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
      </div>
    </div>
  )
}

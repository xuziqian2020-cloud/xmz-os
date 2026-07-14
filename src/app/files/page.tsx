"use client"

import { useEffect, useMemo, useState } from "react"
import type { ChangeEvent } from "react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")

  const fetchFiles = () => {
    fetch("/api/files").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setFiles(d)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchFiles() }, [])

  const filteredFiles = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return files
    return files.filter((file) => {
      const fileName = String(file.file_name || "").toLowerCase()
      return fileName.includes(keyword)
    })
  }, [files, search])

  const allSelected = filteredFiles.length > 0 && filteredFiles.every((file) => selectedIds.includes(file.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredFiles.map((file) => file.id))
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || [])
    if (fileList.length === 0) return
    setUploading(true)
    setError("")
    setUploadMessage("")

    let successCount = 0
    const uploadedFiles: any[] = []
    const errors: string[] = []
    for (const file of fileList) {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/files/upload", { method: "POST", body: formData })
      if (res.ok) {
        const uploaded = await res.json()
        uploadedFiles.push(uploaded)
        successCount += 1
      } else {
        const data = await res.json().catch(() => ({}))
        errors.push(`${file.name}：${data.error || "上传失败"}`)
      }
    }

    if (uploadedFiles.length > 0) {
      setFiles((prev) => [...uploadedFiles, ...prev.filter((item) => !uploadedFiles.some((uploaded) => uploaded.id === item.id))])
      setUploadMessage(`已上传 ${successCount} 个文件`)
    }
    if (errors.length > 0) {
      setError(errors.slice(0, 3).join("；") + (errors.length > 3 ? `；还有 ${errors.length - 3} 个文件失败` : ""))
    }
    e.target.value = ""
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此文件？")) return
    await fetch(`/api/files/${id}`, { method: "DELETE" })
    setFiles((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`确定批量删除 ${selectedIds.length} 个文件吗？`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    try {
      for (const id of ids) {
        await fetch(`/api/files/${id}`, { method: "DELETE" })
      }
      setFiles((prev) => prev.filter((file) => !ids.includes(file.id)))
      setSelectedIds([])
    } finally {
      setDeleting(false)
    }
  }

  const handleRename = async (file: any) => {
    const nextName = prompt("请输入新的文件名", file.file_name)
    if (!nextName || nextName.trim() === file.file_name) return
    const res = await fetch(`/api/files/${file.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: nextName.trim() }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "文件重命名失败")
      return
    }
    fetchFiles()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold">文件管理</h1><p className="mt-1 text-sm text-muted-foreground">管理项目文档和附件</p></div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
          {uploading ? "上传中..." : "+ 上传文件"}
          <input type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="按文件名模糊查询..."
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        visibleCount={filteredFiles.length}
        allSelected={allSelected}
        deleting={deleting}
        onToggleAll={toggleAll}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
      />

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      {uploadMessage && <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">{uploadMessage}</p>}

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无文件</p>
          <p className="mt-1 text-xs text-muted-foreground/60">点击“上传文件”开始</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-lg border border-border bg-card">
          {filteredFiles.map((f, i) => (
            <div key={f.id} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_110px_96px_auto] lg:items-center ${i < filteredFiles.length - 1 ? "border-b border-border" : ""} transition-colors hover:bg-secondary/30`}>
              <div className="flex min-w-0 gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(f.id)}
                  onChange={() => toggleSelection(f.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                />
                <div className="min-w-0">
                  <span title={f.file_name} className="block break-all text-sm font-medium leading-6">{f.file_name}</span>
                  <span className="mt-1 block truncate text-xs uppercase text-muted-foreground" title={f.file_type || "file"}>{f.file_type || "file"}</span>
                </div>
              </div>
              {f.file_size && <span className="text-xs text-muted-foreground">{formatSize(f.file_size)}</span>}
              <span className="hidden text-xs text-muted-foreground lg:inline">{new Date(f.created_at).toLocaleDateString("zh-CN")}</span>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <a href={`/api/files/${f.id}/download`} className="text-xs text-primary hover:underline">下载</a>
                <button onClick={() => handleRename(f)} className="text-xs text-primary hover:underline">重命名</button>
                <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

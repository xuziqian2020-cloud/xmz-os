// 文件管理页
"use client"
import { useState, useEffect } from "react"

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const fetchFiles = () => {
    fetch("/api/files").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setFiles(d)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchFiles() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/files/upload", { method: "POST", body: formData })
    if (res.ok) { fetchFiles() }
    else { setError((await res.json()).error || "上传失败") }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此文件？")) return
    await fetch(`/api/files/${id}`, { method: "DELETE" })
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold">文件管理</h1><p className="mt-1 text-sm text-muted-foreground">管理项目文档和附件</p></div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
          {uploading ? "上传中..." : "+ 上传文件"}
          <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">暂无文件</p>
          <p className="mt-1 text-xs text-muted-foreground/60">点击「上传文件」开始</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-lg border border-border bg-card">
          {files.map((f, i) => (
            <div key={f.id} className={`flex items-center gap-4 px-4 py-3 ${i < files.length - 1 ? "border-b border-border" : ""} hover:bg-secondary/30 transition-colors`}>
              <span className="text-xs shrink-0 w-16 text-muted-foreground uppercase">{f.file_type}</span>
              <span className="flex-1 truncate text-sm">{f.file_name}</span>
              {f.file_size && <span className="text-xs text-muted-foreground">{formatSize(f.file_size)}</span>}
              <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("zh-CN")}</span>
              <a href={f.storage_path} target="_blank" className="text-xs text-primary hover:underline">下载</a>
              <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 hover:underline">删除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

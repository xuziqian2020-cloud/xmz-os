"use client"

import { useEffect, useMemo, useState } from "react"
import type { ChangeEvent } from "react"
import { FolderOpen, Trash2, X } from "lucide-react"
import { BulkActionBar } from "@/components/common/bulk-action-bar"
import { buildFolderGroups, getBaseName, getFolderName, getPreviewType, type ManagedFile as StoredFile } from "@/lib/files/file-manager"

const folderInputProps = { webkitdirectory: "", directory: "" } as any

export default function FilesPage() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null)

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

  const rootFiles = useMemo(() => filteredFiles.filter((file) => !getFolderName(file)), [filteredFiles])
  const folderGroups = useMemo(() => buildFolderGroups(filteredFiles), [filteredFiles])
  const allSelected = filteredFiles.length > 0 && filteredFiles.every((file) => selectedIds.includes(file.id))

  function toggleSelection(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filteredFiles.map((file) => file.id))
  }

  /** XMZADD 20260720 整体选中或取消一个上传文件夹中的全部文件。 */
  function toggleFolderSelection(folder: { files: StoredFile[] }) {
    const folderIds = folder.files.map((file) => file.id)
    const allFolderFilesSelected = folderIds.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => allFolderFilesSelected
      ? prev.filter((id) => !folderIds.includes(id))
      : Array.from(new Set([...prev, ...folderIds])))
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || [])
    if (fileList.length === 0) return
    setUploading(true)
    setError("")
    setUploadMessage("")

    let successCount = 0
    const uploadedFiles: StoredFile[] = []
    const errors: string[] = []
    const hasFolderFiles = fileList.some((file) => Boolean(file.webkitRelativePath))

    for (const file of fileList) {
      const relativePath = file.webkitRelativePath || file.name
      const formData = new FormData()
      formData.append("file", file)
      formData.append("relative_path", relativePath)

      const res = await fetch("/api/files/upload", { method: "POST", body: formData })
      if (res.ok) {
        const uploaded = await res.json()
        uploadedFiles.push(uploaded)
        successCount += 1
      } else {
        const data = await res.json().catch(() => ({}))
        errors.push(`${relativePath}：${data.error || "上传失败"}`)
      }
    }

    if (uploadedFiles.length > 0) {
      setFiles((prev) => [...uploadedFiles, ...prev.filter((item) => !uploadedFiles.some((uploaded) => uploaded.id === item.id))])
      setUploadMessage(hasFolderFiles ? `已上传文件夹中的 ${successCount} 个文件，可打开文件夹查看` : `已上传 ${successCount} 个文件`)
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
      await deleteFiles(ids)
      setFiles((prev) => prev.filter((file) => !ids.includes(file.id)))
      setSelectedIds([])
    } catch (e: any) {
      setError(e.message || "批量删除失败")
    } finally {
      setDeleting(false)
    }
  }

  /** XMZADD 20260720 一次删除指定上传文件夹中的全部文件。 */
  async function handleDeleteFolder(folder: { name: string; files: StoredFile[] }) {
    const ids = folder.files.map((file) => file.id)
    if (!confirm(`确定删除文件夹“${folder.name}”及其中 ${ids.length} 个文件吗？`)) return
    setDeleting(true)
    try {
      await deleteFiles(ids)
      setFiles((prev) => prev.filter((file) => !ids.includes(file.id)))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
    } catch (e: any) {
      setError(e.message || "文件夹删除失败")
    } finally {
      setDeleting(false)
    }
  }

  /** XMZADD 20260720 通过单次请求软删除一组文件记录。 */
  async function deleteFiles(ids: string[]) {
    const res = await fetch("/api/files/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "批量删除失败")
    }
  }

  const handleRename = async (file: StoredFile) => {
    const nextName = prompt("请输入新的文件名", file.file_name || "")
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

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold">文件管理</h1><p className="mt-1 text-sm text-muted-foreground">管理项目文档和附件</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            {uploading ? "上传中..." : "+ 上传文件夹"}
            <input type="file" multiple {...folderInputProps} onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            {uploading ? "上传中..." : "+ 上传文件"}
            <input type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="按文件名或文件夹模糊查询..."
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
          <p className="mt-1 text-xs text-muted-foreground/60">点击“上传文件”或“上传文件夹”开始</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-lg border border-border bg-card">
          {folderGroups.map((folder) => (
            <div key={folder.name} className="border-b border-border last:border-b-0">
              <div className="flex min-h-12 items-center gap-3 px-4 py-2 transition-colors hover:bg-secondary/30">
                <input
                  type="checkbox"
                  aria-label={`选择文件夹 ${folder.name}`}
                  checked={folder.files.every((file) => selectedIds.includes(file.id))}
                  onChange={() => toggleFolderSelection(folder)}
                  className="h-4 w-4 shrink-0 rounded border-border"
                />
                <button
                  type="button"
                  onClick={() => setOpenFolders((prev) => ({ ...prev, [folder.name]: !prev[folder.name] }))}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left text-sm font-medium"
                >
                  <span className="flex min-w-0 items-center gap-2">
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{folder.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{folder.files.length} 个文件</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(folder)}
                  disabled={deleting}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                  aria-label={`删除文件夹 ${folder.name}`}
                  title="删除整个文件夹"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {openFolders[folder.name] && (
                <div className="border-t border-border bg-background/35">
                  {folder.files.map((file, index) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      nested
                      isLast={index === folder.files.length - 1}
                      selected={selectedIds.includes(file.id)}
                      onToggle={() => toggleSelection(file.id)}
                      onPreview={() => setPreviewFile(file)}
                      onRename={() => handleRename(file)}
                      onDelete={() => handleDelete(file.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {rootFiles.map((file, index) => (
            <FileRow
              key={file.id}
              file={file}
              isLast={index === rootFiles.length - 1}
              selected={selectedIds.includes(file.id)}
              onToggle={() => toggleSelection(file.id)}
              onPreview={() => setPreviewFile(file)}
              onRename={() => handleRename(file)}
              onDelete={() => handleDelete(file.id)}
            />
          ))}
        </div>
      )}

      {previewFile && <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  )
}

function FileRow({
  file,
  selected,
  nested = false,
  isLast,
  onToggle,
  onPreview,
  onRename,
  onDelete,
}: {
  file: StoredFile
  selected: boolean
  nested?: boolean
  isLast: boolean
  onToggle: () => void
  onPreview: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_110px_96px_auto] lg:items-center ${!isLast ? "border-b border-border" : ""} ${nested ? "pl-9" : ""} transition-colors hover:bg-secondary/30`}>
      <div className="flex min-w-0 gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border"
        />
        <div className="min-w-0">
          <span title={file.file_name || ""} className="block break-all text-sm font-medium leading-6">{getBaseName(file)}</span>
          <span className="mt-1 block truncate text-xs uppercase text-muted-foreground" title={file.file_type || "file"}>{file.file_type || "file"}</span>
        </div>
      </div>
      {file.file_size ? <span className="text-xs text-muted-foreground">{formatSize(file.file_size)}</span> : <span />}
      <span className="hidden text-xs text-muted-foreground lg:inline">{file.created_at ? new Date(file.created_at).toLocaleDateString("zh-CN") : ""}</span>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <button onClick={onPreview} className="text-xs text-primary hover:underline">预览</button>
        <a href={`/api/files/${file.id}/download`} className="text-xs text-primary hover:underline">下载</a>
        <button onClick={onRename} className="text-xs text-primary hover:underline">重命名</button>
        <button onClick={onDelete} className="text-xs text-red-500 hover:underline">删除</button>
      </div>
    </div>
  )
}

function FilePreviewDialog({ file, onClose }: { file: StoredFile; onClose: () => void }) {
  const previewUrl = `/api/files/${file.id}/download?preview=1`
  const previewType = getPreviewType(file)
  const [textContent, setTextContent] = useState("")
  const [textLoading, setTextLoading] = useState(false)
  const [textError, setTextError] = useState("")

  useEffect(() => {
    if (previewType !== "text") return
    const controller = new AbortController()
    setTextLoading(true)
    setTextError("")
    fetch(previewUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("文件内容读取失败")
        return response.text()
      })
      .then((content) => setTextContent(content))
      .catch((error) => {
        if (error.name !== "AbortError") setTextError(error.message || "文件内容读取失败")
      })
      .finally(() => setTextLoading(false))
    return () => controller.abort()
  }, [previewType, previewUrl])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{file.file_name}</h2>
            <p className="text-xs text-muted-foreground">{file.file_type || "file"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="关闭预览">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-[28rem] flex-1 overflow-auto bg-background p-4">
          {previewType === "image" && <img src={previewUrl} alt={file.file_name || "文件预览"} className="mx-auto max-h-[70dvh] max-w-full rounded object-contain" />}
          {previewType === "frame" && <iframe src={previewUrl} title="文件预览" className="h-[70dvh] w-full rounded border border-border bg-white" />}
          {previewType === "text" && textLoading && <p className="py-20 text-center text-sm text-muted-foreground">正在读取文件内容...</p>}
          {previewType === "text" && textError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{textError}</p>}
          {previewType === "text" && !textLoading && !textError && (
            <pre className="min-h-[28rem] whitespace-pre-wrap break-words rounded-md border border-border bg-card p-4 font-mono text-sm leading-6 text-foreground">{textContent}</pre>
          )}
          {previewType === "none" && (
            <div className="flex h-[28rem] flex-col items-center justify-center text-center">
              <p className="text-sm font-medium">当前格式暂不支持在线预览</p>
              <a href={`/api/files/${file.id}/download`} className="mt-3 rounded-md border border-border px-3 py-2 text-sm text-primary hover:bg-secondary">下载后查看</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

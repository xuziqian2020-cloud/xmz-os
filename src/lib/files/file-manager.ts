export type ManagedFile = {
  id: string
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  created_at?: string | null
}

export type FolderGroup = {
  name: string
  files: ManagedFile[]
}

/** XMZADD 20260720 按上传目录的顶层文件夹归集全部子目录文件。 */
export function buildFolderGroups(files: ManagedFile[]): FolderGroup[] {
  const groups = new Map<string, ManagedFile[]>()
  for (const file of files) {
    const folder = getFolderName(file)
    if (!folder) continue
    const group = groups.get(folder) || []
    group.push(file)
    groups.set(folder, group)
  }
  return Array.from(groups.entries()).map(([name, groupFiles]) => ({ name, files: groupFiles }))
}

/** XMZADD 20260720 获取文件所属的上传顶层目录。 */
export function getFolderName(file: ManagedFile): string {
  const name = file.file_name || ""
  const index = name.indexOf("/")
  return index > 0 ? name.slice(0, index) : ""
}

/** XMZADD 20260720 获取文件路径中的最终文件名。 */
export function getBaseName(file: ManagedFile): string {
  const name = file.file_name || ""
  const index = name.lastIndexOf("/")
  return index >= 0 ? name.slice(index + 1) : name
}

/** XMZADD 20260720 选择可读且与应用主题一致的文件预览方式。 */
export function getPreviewType(file: ManagedFile): "image" | "text" | "frame" | "none" {
  const type = (file.file_type || "").toLowerCase()
  const name = (file.file_name || "").toLowerCase()
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(type)) return "image"
  if (["txt", "md", "markdown", "csv", "json", "log"].includes(type)) return "text"
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".csv") || name.endsWith(".json") || name.endsWith(".log")) return "text"
  if (type === "pdf" || name.endsWith(".pdf")) return "frame"
  return "none"
}

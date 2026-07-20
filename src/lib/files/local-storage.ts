import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve, sep } from "node:path"
import { randomUUID } from "node:crypto"

export const LOCAL_STORAGE_PREFIX = "local:"

export function getLocalFilesRoot(): string {
  return resolve(process.env.XMZ_LOCAL_FILES_DIR || ".local-files")
}

export async function saveLocalFallbackFile(rootDir: string, userId: string, displayName: string, file: File): Promise<string> {
  const userPart = sanitizePathPart(userId) || "user"
  const filePart = sanitizePathPart(getBaseName(displayName || file.name)) || "file"
  const relativePath = `${userPart}/${Date.now()}-${randomUUID()}-${filePart}`
  const localPath = resolveLocalStoragePath(rootDir, `${LOCAL_STORAGE_PREFIX}${relativePath}`)
  if (!localPath) throw new Error("Invalid local file path")

  await mkdir(dirname(localPath), { recursive: true })
  await writeFile(localPath, Buffer.from(await file.arrayBuffer()))
  return `${LOCAL_STORAGE_PREFIX}${relativePath}`
}

export function resolveLocalStoragePath(rootDir: string, storagePath: string): string | null {
  if (!storagePath.startsWith(LOCAL_STORAGE_PREFIX)) return null
  const relativePath = storagePath.slice(LOCAL_STORAGE_PREFIX.length).replace(/\\/g, "/")
  const parts = relativePath.split("/").filter(Boolean)
  if (parts.length === 0) return null
  if (parts.some((part) => part === "." || part === "..")) return null

  const root = resolve(rootDir)
  const localPath = resolve(root, ...parts)
  const normalizedRoot = root.toLowerCase()
  const normalizedLocalPath = localPath.toLowerCase()
  if (normalizedLocalPath !== normalizedRoot && !normalizedLocalPath.startsWith(normalizedRoot + sep)) return null
  return localPath
}

function getBaseName(fileName: string): string {
  const normalized = fileName.replace(/\\/g, "/")
  const index = normalized.lastIndexOf("/")
  return index >= 0 ? normalized.slice(index + 1) : normalized
}

function sanitizePathPart(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
}

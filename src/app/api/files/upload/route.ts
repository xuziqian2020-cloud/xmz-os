import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLocalFilesRoot, saveLocalFallbackFile } from "@/lib/files/local-storage"
import { uploadToStorageBucket } from "@/lib/files/upload"

export const runtime = "nodejs"

const MAX_DATABASE_FALLBACK_DATA_URL_BYTES = 2 * 1024 * 1024
const MAX_DATABASE_FALLBACK_FILE_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "未选择文件" }, { status: 400 })
  const projectId = formData.get("project_id")?.toString() || null
  const relativePath = sanitizeRelativePath(formData.get("relative_path")?.toString() || "")
  const displayName = relativePath || file.name

  const fileName = `${user.id}/${Date.now()}-${displayName}`
  const fileType = inferFileType(file.name, file.type)

  let storagePath = ""
  const { error: uploadError } = await uploadToStorageBucket(supabase.storage.from("user-files"), fileName, file)

  if (!uploadError) {
    const { data: publicUrl } = supabase.storage.from("user-files").getPublicUrl(fileName)
    storagePath = publicUrl.publicUrl
  } else {
    if (canUseLocalFallback() && shouldUseLocalFallback(file)) {
      storagePath = await saveLocalFallbackFile(getLocalFilesRoot(), user.id, displayName, file)
    } else if (file.size > MAX_DATABASE_FALLBACK_FILE_BYTES) {
      return NextResponse.json({ error: "文件上传失败，请确认 Supabase Storage 已创建 user-files bucket。超过 5MB 的文件不能使用数据库兜底保存。" }, { status: 500 })
    } else {
      const buffer = Buffer.from(await file.arrayBuffer())
      storagePath = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`
    }
  }

  const { data, error } = await supabase.from("files").insert({
    user_id: user.id, project_id: projectId, file_name: displayName, file_type: fileType,
    file_size: file.size, storage_path: storagePath,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

function sanitizeRelativePath(value: string): string {
  const normalized = value.replace(/\\/g, "/").split("/").map((part) => part.trim()).filter(Boolean)
  const safeParts = normalized.filter((part) => part !== "." && part !== "..")
  return safeParts.join("/")
}

function shouldUseLocalFallback(file: File): boolean {
  const contentType = file.type || "application/octet-stream"
  const dataUrlBytes = `data:${contentType};base64,`.length + Math.ceil(file.size / 3) * 4
  return dataUrlBytes > MAX_DATABASE_FALLBACK_DATA_URL_BYTES
}

function canUseLocalFallback(): boolean {
  return process.env.NETLIFY !== "true"
}

function inferFileType(fileName: string, mimeType: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (extension) return extension
  const normalized = (mimeType || "").toLowerCase()
  if (normalized.includes("pdf")) return "pdf"
  if (normalized.includes("wordprocessingml")) return "docx"
  if (normalized.includes("spreadsheetml")) return "xlsx"
  if (normalized.includes("presentationml")) return "pptx"
  if (normalized.startsWith("image/")) return normalized.replace("image/", "")
  return "file"
}

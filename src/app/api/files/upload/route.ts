import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "未选择文件" }, { status: 400 })
  const projectId = formData.get("project_id")?.toString() || null

  const fileName = `${user.id}/${Date.now()}-${file.name}`
  const fileType = inferFileType(file.name, file.type)

  let storagePath = ""
  const { error: uploadError } = await supabase.storage.from("user-files").upload(fileName, file, { contentType: file.type || "application/octet-stream", upsert: true })

  if (!uploadError) {
    const { data: publicUrl } = supabase.storage.from("user-files").getPublicUrl(fileName)
    storagePath = publicUrl.publicUrl
  } else {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件上传失败，请确认 Supabase Storage 已创建 user-files bucket。超过 5MB 的文件不能使用数据库兜底保存。" }, { status: 500 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    storagePath = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`
  }

  const { data, error } = await supabase.from("files").insert({
    user_id: user.id, project_id: projectId, file_name: file.name, file_type: fileType,
    file_size: file.size, storage_path: storagePath,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
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

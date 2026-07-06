import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "未选择文件" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileName = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from("user-files").upload(fileName, buffer, { contentType: file.type, upsert: true })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrl } = supabase.storage.from("user-files").getPublicUrl(fileName)

  const { data, error } = await supabase.from("files").insert({
    user_id: user.id, file_name: file.name, file_type: file.type.split("/")[1] || file.type,
    file_size: file.size, storage_path: publicUrl.publicUrl,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

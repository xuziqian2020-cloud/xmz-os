import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const fileName = String(body.file_name || "").trim()
  if (!fileName) return NextResponse.json({ error: "文件名不能为空" }, { status: 400 })

  const { data, error } = await supabase
    .from("files")
    .update({ file_name: fileName, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  await supabase.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", params.id).eq("user_id", user.id)
  return NextResponse.json({ success: true })
}

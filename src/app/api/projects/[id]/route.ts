import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase.from("projects").select("*").eq("id", params.id).single()
  if (!data) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase
    .from("projects").update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id).eq("user_id", user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const { error } = await supabase
    .from("projects").update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

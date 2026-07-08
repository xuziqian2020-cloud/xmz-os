import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  if (!body.project_id) return NextResponse.json({ error: "请选择所属项目" }, { status: 400 })

  const defaultStatus = body.type === "bug" ? "待分析" : body.type === "requirement" ? "待确认" : "未开始"

  const { data, error } = await supabase
    .from("work_plans")
    .insert({ ...body, user_id: user.id, status: body.status || defaultStatus })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const { data, error } = await supabase
    .from("work_plans")
    .select("*")
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

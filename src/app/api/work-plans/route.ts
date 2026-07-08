import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeStatusForType } from "@/lib/work-plans/status-rules"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  if (!body.project_id) return NextResponse.json({ error: "请选择所属项目" }, { status: 400 })

  const statusRule = normalizeStatusForType({
    type: body.type,
    status: body.status,
    progress: body.progress,
  })

  const { data, error } = await supabase
    .from("work_plans")
    .insert({ ...body, user_id: user.id, status: statusRule.status, progress: statusRule.progress })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const url = new URL(request.url)
  const projectId = url.searchParams.get("project_id")
  const type = url.searchParams.get("type")
  const status = url.searchParams.get("status")
  const priority = url.searchParams.get("priority")
  const limit = Number(url.searchParams.get("limit") || "")

  let query = supabase
    .from("work_plans")
    .select("*")
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  if (projectId) query = query.eq("project_id", projectId)
  if (type) query = query.eq("type", type)
  if (status) query = query.eq("status", status)
  if (priority) query = query.eq("priority", priority)
  if (Number.isFinite(limit) && limit > 0) query = query.limit(limit)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

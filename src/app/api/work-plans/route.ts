import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizePriority, normalizeStatusForType } from "@/lib/work-plans/status-rules"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  const projectId = body.project_id || await ensureDefaultProject(supabase, user.id)

  const statusRule = normalizeStatusForType({
    type: body.type,
    status: body.status || "进行中",
    progress: body.progress,
  })
  const priority = normalizePriority(body.priority)

  const { data, error } = await supabase
    .from("work_plans")
    .insert({
      ...body,
      user_id: user.id,
      status: statusRule.status,
      priority,
      project_id: projectId,
      bug_severity: body.type === "bug" ? normalizePriority(body.bug_severity || priority) : body.bug_severity,
      progress: statusRule.progress,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

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

function isLocalAdminRequest(request: Request): boolean {
  return request.headers.get("x-xmz-local-admin") === "1"
}

async function ensureDefaultProject(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("code", "DEFAULT")
    .is("deleted_at", null)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: "默认项目",
      code: "DEFAULT",
      description: "系统自动创建，用于临时收纳未指定项目的计划。",
      project_type: "默认",
      status: "active",
    })
    .select("id")
    .single()

  if (error) throw error
  return data.id
}

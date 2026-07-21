import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const url = new URL(request.url)
  const projectId = url.searchParams.get("project_id")
  const category = url.searchParams.get("category")
  const search = url.searchParams.get("search")

  let query = supabase
    .from("knowledge_documents")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (projectId) query = query.eq("project_id", projectId)
  if (category) query = query.eq("category", category)
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  const { data, error } = await supabase.from("knowledge_documents").insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const url = new URL(request.url)
  const projectId = url.searchParams.get("project_id")
  let query = supabase.from("ideas").select("*").is("deleted_at", null).order("created_at", { ascending: false })
  if (projectId) query = query.eq("project_id", projectId)
  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase.from("ideas").insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

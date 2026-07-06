// API: 项目 CRUD
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/projects — 创建项目
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const { name, code, description, tech_stack, project_type, git_url, local_path } = body

  if (!name) return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 })

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      code: code || null,
      description: description || null,
      tech_stack: tech_stack || null,
      project_type: project_type || null,
      git_url: git_url || null,
      local_path: local_path || null,
      status: "active",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

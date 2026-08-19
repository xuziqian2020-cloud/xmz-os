import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const targetTypes = new Set(["lesson", "practice", "project"])

/** XMZADD 20260819 读取当前用户独立于知识库的学习笔记。 */
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const url = new URL(request.url)
  const targetType = url.searchParams.get("target_type")
  const targetSlug = url.searchParams.get("target_slug")
  let query = supabase.from("learning_notes").select("*").order("updated_at", { ascending: false })

  if (targetType) query = query.eq("target_type", targetType)
  if (targetSlug) query = query.eq("target_slug", targetSlug)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** XMZADD 20260819 保存单节课程、练习或项目的一篇个人学习笔记。 */
export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const targetType = String(body.target_type || "")
  const targetSlug = String(body.target_slug || "").trim()
  const content = String(body.content || "").trim()

  if (!targetTypes.has(targetType) || !targetSlug) {
    return NextResponse.json({ error: "学习笔记目标无效" }, { status: 400 })
  }
  if (content.length > 20000) return NextResponse.json({ error: "学习笔记不能超过 20000 个字符" }, { status: 400 })

  const { data, error } = await supabase
    .from("learning_notes")
    .upsert({
      user_id: user.id,
      target_type: targetType,
      target_slug: targetSlug,
      content,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,target_type,target_slug" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

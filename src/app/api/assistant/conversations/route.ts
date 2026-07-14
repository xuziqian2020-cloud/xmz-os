import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { data, error } = await supabase
    .from("assistant_conversations")
    .select("id,title,created_at,updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const title = buildConversationTitle(String(body.title || "新的对话"))
  const { data, error } = await supabase
    .from("assistant_conversations")
    .insert({ user_id: user.id, title })
    .select("id,title,created_at,updated_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

function buildConversationTitle(value: string): string {
  const title = value.replace(/\s+/g, " ").trim()
  if (!title) return "新的对话"
  return title.length > 28 ? `${title.slice(0, 28)}...` : title
}

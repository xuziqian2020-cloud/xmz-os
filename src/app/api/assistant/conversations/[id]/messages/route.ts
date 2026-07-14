import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const allowed = await ensureConversation(supabase, params.id, user.id)
  if (!allowed) return NextResponse.json({ error: "对话不存在" }, { status: 404 })

  const { data, error } = await supabase
    .from("assistant_messages")
    .select("id,role,content,attachments,created_at")
    .eq("conversation_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const allowed = await ensureConversation(supabase, params.id, user.id)
  if (!allowed) return NextResponse.json({ error: "对话不存在" }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const role = body.role === "assistant" ? "assistant" : "user"
  const content = String(body.content || "").trim()
  if (!content) return NextResponse.json({ error: "消息不能为空" }, { status: 400 })

  const { data, error } = await supabase
    .from("assistant_messages")
    .insert({
      conversation_id: params.id,
      user_id: user.id,
      role,
      content,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
    })
    .select("id,role,content,attachments,created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from("assistant_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)

  return NextResponse.json(data)
}

async function ensureConversation(supabase: any, id: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("assistant_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  return !error && !!data
}

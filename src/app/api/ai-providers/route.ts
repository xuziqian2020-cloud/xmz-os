import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from("ai_providers").select("*").is("deleted_at", null).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  if (!body.provider_name) return NextResponse.json({ error: "供应商名称不能为空" }, { status: 400 })
  if (!body.provider_type) return NextResponse.json({ error: "供应商类型不能为空" }, { status: 400 })
  if (!body.base_url) return NextResponse.json({ error: "API 地址不能为空" }, { status: 400 })
  if (!body.api_key) return NextResponse.json({ error: "API Key 不能为空" }, { status: 400 })

  const { data, error } = await supabase
    .from("ai_providers")
    .insert({
      user_id: user.id,
      provider_name: body.provider_name,
      provider_type: body.provider_type,
      base_url: body.base_url,
      api_key: body.api_key,
      default_model: body.default_model || null,
      is_enabled: body.is_enabled ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

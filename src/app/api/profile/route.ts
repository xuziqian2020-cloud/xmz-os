import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const allowedFields = ["display_name", "avatar_url", "bio", "department", "role_title"] as const

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || {
    user_id: user.id,
    display_name: user.email?.split("@")[0] || "开发者",
    avatar_url: "/images/xiaomei-avatar.png",
    bio: "",
    department: "",
    role_title: "",
  })
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const profile: Record<string, string> = {}
  for (const field of allowedFields) {
    profile[field] = String(body[field] || "").trim()
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      user_id: user.id,
      ...profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

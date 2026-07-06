import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  await supabase.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", params.id).eq("user_id", user.id)
  return NextResponse.json({ success: true })
}

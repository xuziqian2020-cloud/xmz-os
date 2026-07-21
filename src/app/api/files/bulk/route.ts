import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** XMZADD 20260720 单次软删除用户选中的多个文件或完整上传文件夹。 */
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    : []
  if (ids.length === 0) return NextResponse.json({ error: "请选择要删除的文件" }, { status: 400 })

  const { error } = await supabase
    .from("files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("id", ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, deleted: ids.length })
}

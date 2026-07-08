import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeStatusForType } from "@/lib/work-plans/status-rules"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase.from("work_plans").select("*").eq("id", params.id).single()
  if (!data) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body = await request.json()
  const { data: current } = await supabase
    .from("work_plans")
    .select("type, status, progress")
    .eq("id", params.id)
    .single()

  if (!current) return NextResponse.json({ error: "未找到" }, { status: 404 })

  const statusRule = normalizeStatusForType({
    type: body.type || current.type,
    status: body.status ?? current.status,
    progress: body.progress ?? current.progress,
  })

  const { data, error } = await supabase
    .from("work_plans").update({ ...body, status: statusRule.status, progress: statusRule.progress, updated_at: new Date().toISOString() })
    .eq("id", params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { error } = await supabase.from("work_plans").update({ deleted_at: new Date().toISOString() }).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

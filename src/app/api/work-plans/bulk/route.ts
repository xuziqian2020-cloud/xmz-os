import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizePriority, normalizeStatusForType, visiblePlanStatuses } from "@/lib/work-plans/status-rules"

export async function PUT(request: Request) {
  const supabase = createClient()
  const body = await request.json()
  const ids = getIds(body)
  if (ids.length === 0) return NextResponse.json({ error: "请选择要更新的计划" }, { status: 400 })

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (body.priority !== undefined) {
    const priority = normalizePriority(body.priority)
    updatePayload.priority = priority
  }

  if (body.status !== undefined) {
    const statusRule = normalizeStatusForType({ status: body.status })
    updatePayload.status = statusRule.status
    if (statusRule.status === "进行中") {
      updatePayload.progress = 0
    }
    if (statusRule.status === visiblePlanStatuses[1] || statusRule.status === visiblePlanStatuses[2]) {
      updatePayload.progress = statusRule.progress
    }
  }

  if (Object.keys(updatePayload).length === 1) {
    return NextResponse.json({ error: "请选择要更新的状态" }, { status: 400 })
  }

  const { error } = await supabase
    .from("work_plans")
    .update(updatePayload)
    .in("id", ids)
    .is("deleted_at", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updatePayload.priority) {
    const { error: bugError } = await supabase
      .from("work_plans")
      .update({ bug_severity: updatePayload.priority, updated_at: updatePayload.updated_at })
      .in("id", ids)
      .eq("type", "bug")
      .is("deleted_at", null)

    if (bugError) return NextResponse.json({ error: bugError.message }, { status: 500 })
  }

  const { data, error: selectError } = await supabase
    .from("work_plans")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null)

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const body = await request.json()
  const ids = getIds(body)
  if (ids.length === 0) return NextResponse.json({ error: "请选择要删除的计划" }, { status: 400 })

  const { error } = await supabase
    .from("work_plans")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids)
    .is("deleted_at", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

function getIds(body: any): string[] {
  if (!Array.isArray(body?.ids)) return []
  const ids: string[] = []
  for (const id of body.ids) {
    const value = String(id || "").trim()
    if (value && !ids.includes(value)) ids.push(value)
  }
  return ids
}

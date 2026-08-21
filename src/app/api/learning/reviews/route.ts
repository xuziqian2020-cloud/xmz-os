import { NextResponse } from "next/server"
import { enterpriseProjects } from "@/lib/learning/catalog"
import { getLearningAccessGaps } from "@/lib/learning/access"
import { createClient } from "@/lib/supabase/server"

const decisions = new Set(["changes_requested", "accepted"])
const requiredEvidenceTypes = ["repository", "screenshot", "test_result"]

/** XMZADD 20260819 向学习者展示本人项目的负责人 UAT 与评审决定，避免毕业状态仅由前端判断。 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { data, error } = await supabase
    .from("learning_project_reviews")
    .select("id, user_id, reviewer_id, project_slug, checklist, decision, review_notes, updated_at")
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data ?? [], can_review: user.app_metadata?.learning_reviewer === true })
}

/** XMZADD 20260819 由具备 learning_reviewer 权限的负责人完成 UAT 后，受控写入项目验收与毕业资格。 */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  if (user.app_metadata?.learning_reviewer !== true) return NextResponse.json({ error: "仅已配置学习评审权限的负责人可进行验收。" }, { status: 403 })

  const body = await request.json()
  const targetUserId = String(body.user_id || "").trim()
  const projectSlug = String(body.project_slug || "").trim()
  const decision = String(body.decision || "")
  const checklist = Array.isArray(body.checklist) ? body.checklist : []
  const reviewNotes = String(body.review_notes || "").trim()
  const project = enterpriseProjects.find((item) => item.slug === projectSlug)

  if (!targetUserId || !project || !decisions.has(decision) || targetUserId === user.id) {
    return NextResponse.json({ error: "评审参数无效，且负责人不能验收自己的项目。" }, { status: 400 })
  }
  if (decision === "accepted" && checklist.length === 0) {
    return NextResponse.json({ error: "验收前必须记录 UAT 与评审清单。" }, { status: 400 })
  }

  const { data: completedRows, error: completedRowsError } = await supabase
    .from("learning_progress")
    .select("content_slug")
    .eq("user_id", targetUserId)
    .eq("content_type", "lesson")
    .in("status", ["completed", "accepted"])
  if (completedRowsError) return NextResponse.json({ error: completedRowsError.message }, { status: 500 })

  const accessGaps = getLearningAccessGaps("project", projectSlug, (completedRows ?? []).map((row) => row.content_slug))
  if (accessGaps.length > 0) {
    return NextResponse.json({ error: `学习者尚未满足项目能力前置：${accessGaps.join("、")}` }, { status: 403 })
  }

  if (decision === "accepted") {
    const { data: evidenceRows, error: evidenceError } = await supabase
      .from("learning_project_evidence")
      .select("evidence_type")
      .eq("user_id", targetUserId)
      .eq("project_slug", projectSlug)
    if (evidenceError) return NextResponse.json({ error: evidenceError.message }, { status: 500 })

    const evidenceTypes = new Set((evidenceRows ?? []).map((item) => item.evidence_type))
    const missingEvidence = requiredEvidenceTypes.filter((type) => !evidenceTypes.has(type))
    if (missingEvidence.length > 0) {
      return NextResponse.json({ error: `验收前缺少交付证据：${missingEvidence.join("、")}` }, { status: 403 })
    }
  }

  const { data: review, error: reviewError } = await supabase
    .from("learning_project_reviews")
    .upsert({ user_id: targetUserId, reviewer_id: user.id, project_slug: projectSlug, checklist, decision, review_notes: reviewNotes, updated_at: new Date().toISOString() }, { onConflict: "user_id,project_slug,reviewer_id" })
    .select()
    .single()
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  const { error: progressError } = await supabase
    .from("learning_progress")
    .upsert({ user_id: targetUserId, content_type: "project", content_slug: projectSlug, status: decision === "accepted" ? "accepted" : "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,content_type,content_slug" })
  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 })

  return NextResponse.json(review)
}

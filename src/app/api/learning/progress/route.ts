import { NextResponse } from "next/server"
import { getLearningAccessGaps, isKnownLearningContent, type LearningContentType } from "@/lib/learning/access"
import { createClient } from "@/lib/supabase/server"

const contentTypes = new Set(["lesson", "practice", "project"])
const progressStatuses = new Set(["in_progress", "completed"])

/** XMZADD 20260819 返回当前登录用户的学习进度，供学习路径计算解锁状态。 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { data, error } = await supabase
    .from("learning_progress")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** XMZADD 20260819 保存课程、练习或项目的当前学习状态。 */
export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const contentType = String(body.content_type || "") as LearningContentType
  const contentSlug = String(body.content_slug || "").trim()
  const status = String(body.status || "in_progress")
  const score = body.score === undefined || body.score === null ? null : Number(body.score)
  const attemptCount = Number(body.attempt_count || 0)

  if (status === "accepted") {
    return NextResponse.json({ error: "毕业项目必须由负责人完成 UAT 与评审后在受控审核流程中验收" }, { status: 403 })
  }
  if (!contentTypes.has(contentType) || !contentSlug || !progressStatuses.has(status) || !isKnownLearningContent(contentType, contentSlug)) {
    return NextResponse.json({ error: "学习进度参数无效" }, { status: 400 })
  }
  if (!Number.isFinite(attemptCount) || attemptCount < 0 || (score !== null && !Number.isFinite(score))) {
    return NextResponse.json({ error: "学习进度数值无效" }, { status: 400 })
  }

  const { data: completedRows, error: completedRowsError } = await supabase
    .from("learning_progress")
    .select("content_type, content_slug, status")
    .eq("content_type", "lesson")
    .in("status", ["completed", "accepted"])
  if (completedRowsError) return NextResponse.json({ error: completedRowsError.message }, { status: 500 })

  const completedLessonSlugs = (completedRows ?? []).map((row) => row.content_slug)
  const accessGaps = getLearningAccessGaps(contentType, contentSlug, completedLessonSlugs)
  if (accessGaps.length > 0) {
    return NextResponse.json({ error: `请先完成前置能力：${accessGaps.join("、")}` }, { status: 403 })
  }

  if (contentType === "lesson" && status === "completed") {
    const { data: passedAttempt, error: attemptError } = await supabase
      .from("learning_code_attempts")
      .select("id")
      .eq("content_type", "lesson")
      .eq("content_slug", contentSlug)
      .eq("passed", true)
      .limit(1)
      .maybeSingle()
    if (attemptError) return NextResponse.json({ error: attemptError.message }, { status: 500 })
    if (!passedAttempt) return NextResponse.json({ error: "请先通过本课代码练习，再解锁下一项能力。" }, { status: 403 })
  }

  const requiredEvidenceTypes = ["repository", "test_result", "screenshot"]
  if (contentType === "project" && status === "completed") {
    const { data: evidenceRows, error: evidenceRowsError } = await supabase
      .from("learning_project_evidence")
      .select("evidence_type")
      .eq("project_slug", contentSlug)
    if (evidenceRowsError) return NextResponse.json({ error: evidenceRowsError.message }, { status: 500 })

    const submittedEvidenceTypes = new Set((evidenceRows ?? []).map((row) => row.evidence_type))
    const missingEvidence = requiredEvidenceTypes.filter((evidenceType) => !submittedEvidenceTypes.has(evidenceType))
    if (missingEvidence.length > 0) {
      return NextResponse.json({ error: `项目完成前必须提交：${missingEvidence.join("、")}` }, { status: 403 })
    }
  }

  const isCompleted = status === "completed"
  const { data, error } = await supabase
    .from("learning_progress")
    .upsert({
      user_id: user.id,
      content_type: contentType,
      content_slug: contentSlug,
      status,
      score,
      attempt_count: Math.floor(attemptCount),
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,content_type,content_slug" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

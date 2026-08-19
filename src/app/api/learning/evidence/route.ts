import { NextResponse } from "next/server"
import { getLearningAccessGaps, isKnownLearningContent } from "@/lib/learning/access"
import { createClient } from "@/lib/supabase/server"

const evidenceTypes = new Set(["repository", "deployment", "screenshot", "test_result", "retrospective"])

/** XMZADD 20260819 读取项目作品集证据，供学习者汇总交付材料。 */
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const projectSlug = new URL(request.url).searchParams.get("project_slug")
  let query = supabase.from("learning_project_evidence").select("*").order("created_at", { ascending: false })
  if (projectSlug) query = query.eq("project_slug", projectSlug)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** XMZADD 20260819 保存项目仓库、部署、测试或复盘等可审核交付证据。 */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const projectSlug = String(body.project_slug || "").trim()
  const evidenceType = String(body.evidence_type || "")
  const title = String(body.title || "").trim()
  const url = String(body.url || "").trim()
  const notes = String(body.notes || "").trim()

  if (!projectSlug || !title || !evidenceTypes.has(evidenceType) || !isKnownLearningContent("project", projectSlug)) {
    return NextResponse.json({ error: "项目证据参数无效" }, { status: 400 })
  }
  if (url && !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "证据链接必须以 http 或 https 开头" }, { status: 400 })

  const { data: completedRows, error: completedRowsError } = await supabase
    .from("learning_progress")
    .select("content_slug")
    .eq("content_type", "lesson")
    .in("status", ["completed", "accepted"])
  if (completedRowsError) return NextResponse.json({ error: completedRowsError.message }, { status: 500 })

  const accessGaps = getLearningAccessGaps("project", projectSlug, (completedRows ?? []).map((row) => row.content_slug))
  if (accessGaps.length > 0) {
    return NextResponse.json({ error: `请先完成前置能力：${accessGaps.join("、")}` }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("learning_project_evidence")
    .insert({
      user_id: user.id,
      project_slug: projectSlug,
      evidence_type: evidenceType,
      title,
      url: url || null,
      notes,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

import { NextResponse } from "next/server"
import { getLearningAccessGaps, isKnownLearningContent, type LearningContentType } from "@/lib/learning/access"
import { createClient } from "@/lib/supabase/server"

const secretPattern = /(sk-[A-Za-z0-9_-]{16,}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|api[_-]?key\s*[=:]\s*['"][^'"]{12,})/i

/** XMZADD 20260819 保存浏览器 Python 练习记录，同时拒绝明显的密钥内容。 */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await request.json()
  const contentType = String(body.content_type || "") as LearningContentType
  const contentSlug = String(body.content_slug || "").trim()
  const code = String(body.code || "")
  const output = String(body.output || "")
  const passed = Boolean(body.passed)

  if (!contentSlug || !["lesson", "practice"].includes(contentType) || code.length > 20000 || output.length > 10000 || !isKnownLearningContent(contentType, contentSlug)) {
    return NextResponse.json({ error: "代码练习内容无效或过长" }, { status: 400 })
  }
  if (secretPattern.test(code) || secretPattern.test(output)) {
    return NextResponse.json({ error: "学习中心不保存密钥或私钥内容，请立即从代码中移除" }, { status: 400 })
  }

  const { data: completedRows, error: completedRowsError } = await supabase
    .from("learning_progress")
    .select("content_slug")
    .eq("content_type", "lesson")
    .in("status", ["completed", "accepted"])
  if (completedRowsError) return NextResponse.json({ error: completedRowsError.message }, { status: 500 })

  const accessGaps = getLearningAccessGaps(contentType, contentSlug, (completedRows ?? []).map((row) => row.content_slug))
  if (accessGaps.length > 0) {
    return NextResponse.json({ error: `请先完成前置能力：${accessGaps.join("、")}` }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("learning_code_attempts")
    .insert({ user_id: user.id, content_type: contentType, content_slug: contentSlug, code, output, passed })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

import { NextResponse } from "next/server"
import { buildChatRequest, extractChatAnswer } from "@/lib/ai/chat"
import { parseProviderJson, resolveServerProvider } from "@/lib/ai/server-provider"
import { buildMeetingMinutesHtml, buildMeetingMinutesPrompt } from "@/lib/tools/meeting-minutes"

export const runtime = "nodejs"

/** XMZADD 20260722 使用文本模型将会议转写整理为可下载的会议纪要 */
export async function POST(request: Request) {
  const body = await request.json()
  const title = String(body.title || "会议纪要")
  const attendees = Array.isArray(body.attendees) ? body.attendees.map(String).filter(Boolean) : []
  const transcript = String(body.transcript || "").trim()
  if (!transcript) return NextResponse.json({ error: "请先完成会议转写" }, { status: 400 })

  const provider = await resolveServerProvider(body.provider || null, "chat")
  if (!provider) return NextResponse.json({ error: "请先在 AI 设置启用一个供应商" }, { status: 400 })

  const prompt = buildMeetingMinutesPrompt({ title, attendees, transcript })
  const spec = buildChatRequest(provider, [{ role: "user", content: prompt }], "请整理会议纪要。")

  try {
    const res = await fetch(spec.url, { method: "POST", headers: spec.headers, body: JSON.stringify(spec.body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: data?.error?.message || `会议纪要生成失败：HTTP ${res.status}` }, { status: 502 })

    const minutes = extractChatAnswer(data, spec.responseType)
    const html = buildMeetingMinutesHtml({ title, attendees, transcript, minutes })
    return NextResponse.json({ minutes, html })
  } catch {
    return NextResponse.json({ error: "会议纪要生成失败，请检查 AI 设置" }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { buildChatRequest, extractChatAnswer, selectChatProvider, type AIProviderConfig } from "@/lib/ai/chat"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const messages = Array.isArray(body.messages) ? body.messages : []
  const context = String(body.context || "")
  const provider = await resolveProvider(body.provider)

  if (!provider) {
    return NextResponse.json({ error: "请先到 AI 设置配置并启用一个供应商。" }, { status: 400 })
  }

  const spec = buildChatRequest(provider, messages, context)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(spec.url, {
      method: "POST",
      headers: spec.headers,
      body: JSON.stringify(spec.body),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || `AI 请求失败：HTTP ${res.status}` }, { status: 502 })
    }

    const answer = extractChatAnswer(data, spec.responseType)
    if (!answer) return NextResponse.json({ error: "AI 没有返回有效内容。" }, { status: 502 })
    return NextResponse.json({ answer })
  } catch (e: any) {
    return NextResponse.json({ error: e.name === "AbortError" ? "AI 请求超时" : "AI 请求失败，请检查供应商配置。" }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}

async function resolveProvider(localProvider?: AIProviderConfig | null): Promise<AIProviderConfig | null> {
  const selectedLocal = localProvider ? selectChatProvider([localProvider]) : null
  if (selectedLocal) return selectedLocal

  const supabase = createClient()
  const { data } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(5)

  return selectChatProvider((data || []) as AIProviderConfig[])
}

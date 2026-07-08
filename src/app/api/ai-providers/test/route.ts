import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const baseUrl = String(body.base_url || "").replace(/\/$/, "")
  const apiKey = String(body.api_key || "")

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "请先填写 API 地址和 API Key" }, { status: 400 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    })

    if (!res.ok) {
      return NextResponse.json({ error: `连接失败：HTTP ${res.status}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.name === "AbortError" ? "连接超时" : "连接失败，请检查 API 地址" }, { status: 400 })
  } finally {
    clearTimeout(timer)
  }
}

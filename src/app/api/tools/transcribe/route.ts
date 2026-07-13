import { NextResponse } from "next/server"
import { buildTranscriptionForm, buildTranscriptionUrl, extractTranscriptionText, supportsAudioTranscription } from "@/lib/ai/audio"
import { parseProviderJson, resolveServerProvider } from "@/lib/ai/server-provider"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "请先选择音频或视频文件" }, { status: 400 })

  const provider = await resolveServerProvider(parseProviderJson(formData.get("provider")))
  if (!provider) return NextResponse.json({ error: "请先在 AI 设置启用一个支持音频转写的供应商" }, { status: 400 })

  const model = String(formData.get("model") || provider.default_model || "whisper-1")
  const prompt = String(formData.get("prompt") || "")
  const diarize = String(formData.get("diarize") || "") === "true"
  if (!supportsAudioTranscription(provider, model)) {
    return NextResponse.json({
      error: "当前启用供应商不支持音频转写，请在 AI 设置启用 OpenAI 或兼容 /audio/transcriptions 的供应商，并填写 whisper-1、gpt-4o-transcribe 等转写模型",
    }, { status: 400 })
  }

  const outgoing = buildTranscriptionForm(file, { fileName: file.name || "audio.webm", model, prompt, diarize })

  try {
    const res = await fetch(buildTranscriptionUrl(provider), {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.api_key}` },
      body: outgoing,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: data?.error?.message || `转写失败：HTTP ${res.status}` }, { status: 502 })

    const text = extractTranscriptionText(data)
    if (!text) return NextResponse.json({ error: "没有识别到文字" }, { status: 502 })
    return NextResponse.json({ text, raw: data })
  } catch {
    return NextResponse.json({ error: "转写请求失败，请检查供应商是否支持音频转写" }, { status: 502 })
  }
}

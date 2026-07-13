import type { AIProviderConfig } from "@/lib/ai/chat"

export type TranscriptionOptions = {
  fileName: string
  model?: string | null
  prompt?: string | null
  diarize?: boolean
}

export function buildTranscriptionForm(file: Blob, options: TranscriptionOptions): FormData {
  const form = new FormData()
  form.append("file", new File([file], options.fileName, { type: file.type || "application/octet-stream" }))
  form.append("model", options.model || "whisper-1")
  form.append("response_format", "json")
  if (options.prompt?.trim()) form.append("prompt", options.prompt.trim())
  if (options.diarize) form.append("diarize", "true")
  return form
}

export function buildTranscriptionUrl(provider: AIProviderConfig): string {
  return `${String(provider.base_url || "").replace(/\/+$/, "")}/audio/transcriptions`
}

export function supportsAudioTranscription(provider: AIProviderConfig, model?: string | null): boolean {
  const baseUrl = String(provider.base_url || "").toLowerCase()
  const providerType = String(provider.provider_type || provider.provider_name || "").toLowerCase()
  const modelName = String(model || provider.default_model || "").toLowerCase()

  if (!baseUrl || !provider.api_key?.trim()) return false
  if (baseUrl.includes("deepseek") || providerType.includes("deepseek")) return false
  if (baseUrl.includes("anthropic") || providerType.includes("claude") || providerType.includes("anthropic")) return false
  if (/whisper|transcribe|audio/.test(modelName)) return true
  if (baseUrl.includes("api.openai.com") || providerType.includes("openai")) return true
  return baseUrl.endsWith("/v1") || baseUrl.includes("compatible")
}

export function extractTranscriptionText(data: any): string {
  if (typeof data?.text === "string") return data.text.trim()
  if (Array.isArray(data?.segments)) {
    return data.segments.map((segment: any) => {
      const speaker = segment.speaker || segment.speaker_id
      const text = String(segment.text || "").trim()
      return speaker ? `${speaker}：${text}` : text
    }).filter(Boolean).join("\n")
  }
  return ""
}

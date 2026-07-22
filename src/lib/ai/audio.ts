import type { AIProviderConfig } from "@/lib/ai/chat"

export type TranscriptionOptions = {
  fileName: string
  model?: string | null
  prompt?: string | null
  diarize?: boolean
}

export type TranscriptionResult = {
  text: string
  hasSpeakerLabels: boolean
}

/** XMZADD 20260722 构造兼容 FunASR 的音频转写请求并请求发言人分段 */
export function buildTranscriptionForm(file: Blob, options: TranscriptionOptions): FormData {
  const form = new FormData()
  form.append("file", new File([file], options.fileName, { type: file.type || "application/octet-stream" }))
  form.append("model", options.model || "sensevoice")
  form.append("response_format", "verbose_json")
  if (options.prompt?.trim()) form.append("prompt", options.prompt.trim())
  if (options.diarize) {
    form.append("diarize", "true")
    form.append("spk", "true")
  }
  return form
}

/** XMZADD 20260722 生成 OpenAI 兼容音频转写接口地址 */
export function buildTranscriptionUrl(provider: AIProviderConfig): string {
  return `${String(provider.base_url || "").replace(/\/+$/, "")}/audio/transcriptions`
}

/** XMZADD 20260722 校验当前供应商可用于会议音频转写 */
export function supportsAudioTranscription(provider: AIProviderConfig, model?: string | null): boolean {
  const baseUrl = String(provider.base_url || "").toLowerCase()
  const providerType = String(provider.provider_type || provider.provider_name || "").toLowerCase()
  const modelName = String(model || provider.default_model || "").toLowerCase()

  if (!baseUrl || !provider.api_key?.trim()) return false
  if (baseUrl.includes("deepseek") || providerType.includes("deepseek")) return false
  if (baseUrl.includes("anthropic") || providerType.includes("claude") || providerType.includes("anthropic")) return false
  if (/whisper|transcribe|audio|sensevoice/.test(modelName)) return true
  if (baseUrl.includes("api.openai.com") || providerType.includes("openai")) return true
  return baseUrl.endsWith("/v1") || baseUrl.includes("compatible")
}

/** XMZADD 20260722 将 FunASR 分段结果整理为可直接生成会议纪要的逐发言人文本 */
export function extractTranscriptionResult(data: any): TranscriptionResult {
  const segments = Array.isArray(data?.segments) ? data.segments : []
  const lines: string[] = []
  let hasSpeakerLabels = false

  for (const segment of segments) {
    const text = String(segment?.text || "").trim()
    const speaker = String(segment?.speaker || segment?.speaker_id || "").trim()
    if (!text) continue
    if (speaker) {
      hasSpeakerLabels = true
      lines.push(`发言人 ${speaker}：${text}`)
      continue
    }
    lines.push(text)
  }

  return {
    text: lines.length > 0 ? lines.join("\n") : String(data?.text || "").trim(),
    hasSpeakerLabels,
  }
}

/** XMZADD 20260722 保持既有调用方仅获取转写正文的兼容行为 */
export function extractTranscriptionText(data: any): string {
  return extractTranscriptionResult(data).text
}

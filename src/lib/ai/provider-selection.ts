import type { AIProviderConfig } from "./chat"

export type ProviderPurpose = "audio" | "chat" | "meeting_minutes"

/** XMZADD 20260722 统一本地服务地址格式以避免尾部斜杠影响用途识别 */
function normalizeBaseUrl(baseUrl: string | null | undefined): string {
  return String(baseUrl || "").replace(/\/+$/, "").toLowerCase()
}

/** XMZADD 20260722 识别本机 FunASR 地址以阻止其进入文本生成候选集 */
function isLocalFunasrUrl(baseUrl: string | null | undefined): boolean {
  const normalized = normalizeBaseUrl(baseUrl)
  return normalized === "http://127.0.0.1:8001/v1" || normalized === "http://localhost:8001/v1"
}

/** XMZADD 20260722 识别本机 Ollama 地址以保证会议内容不发送至外部供应商 */
function isLocalOllamaUrl(baseUrl: string | null | undefined): boolean {
  const normalized = normalizeBaseUrl(baseUrl)
  return normalized === "http://127.0.0.1:11434/v1" || normalized === "http://localhost:11434/v1"
}

/** XMZADD 20260722 判断供应商是否具备本地调用所需的完整配置 */
export function isConfiguredProvider(provider: AIProviderConfig): boolean {
  return provider.is_enabled !== false
    && Boolean(provider.base_url?.trim() && provider.api_key?.trim() && provider.default_model?.trim())
}

/** XMZADD 20260722 按本机 FunASR 地址识别音频供应商，避免被错误用于文本生成 */
export function isAudioProvider(provider: AIProviderConfig): boolean {
  return isLocalFunasrUrl(provider.base_url)
}

/** XMZADD 20260722 从已启用配置中选择用于音频转写的 FunASR 服务 */
export function selectAudioProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) {
    if (isConfiguredProvider(provider) && isAudioProvider(provider)) return provider
  }

  return null
}

/** XMZADD 20260722 仅选择本机 Ollama 的 qwen3:4b，确保会议纪要不会调用付费供应商 */
export function isMeetingMinutesProvider(provider: AIProviderConfig): boolean {
  const model = String(provider.default_model || "").trim().toLowerCase()
  return isLocalOllamaUrl(provider.base_url) && model === "qwen3:4b"
}

/** XMZADD 20260722 从已启用配置中选择仅用于会议纪要的本机 Ollama 服务 */
export function selectMeetingMinutesProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) {
    if (isConfiguredProvider(provider) && isMeetingMinutesProvider(provider)) return provider
  }

  return null
}

/** XMZADD 20260722 从已启用配置中选择非 FunASR 的文本生成服务 */
export function selectTextProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) {
    if (isConfiguredProvider(provider) && !isAudioProvider(provider)) return provider
  }

  return null
}

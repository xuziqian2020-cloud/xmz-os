import type { AIProviderConfig } from "./chat"

export type ProviderPurpose = "audio" | "chat"

/** XMZADD 20260722 判断供应商是否具备本地调用所需的完整配置 */
export function isConfiguredProvider(provider: AIProviderConfig): boolean {
  return provider.is_enabled !== false
    && Boolean(provider.base_url?.trim() && provider.api_key?.trim() && provider.default_model?.trim())
}

/** XMZADD 20260722 按固定地址与模型识别本地 FunASR 音频供应商 */
export function isAudioProvider(provider: AIProviderConfig): boolean {
  const baseUrl = String(provider.base_url || "").replace(/\/+$/, "").toLowerCase()
  const model = String(provider.default_model || "").trim().toLowerCase()
  return baseUrl === "http://127.0.0.1:8000/v1" && model === "sensevoice"
}

/** XMZADD 20260722 从已启用配置中选择用于音频转写的 FunASR 服务 */
export function selectAudioProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) {
    if (isConfiguredProvider(provider) && isAudioProvider(provider)) return provider
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

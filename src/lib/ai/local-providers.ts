import { selectChatProvider, type AIProviderConfig } from "@/lib/ai/chat"
import { selectAudioProvider, selectMeetingMinutesProvider } from "@/lib/ai/provider-selection"

export const LOCAL_AI_PROVIDERS_KEY = "xmz-os-local-ai-providers"

export function readBrowserAiProviders(): AIProviderConfig[] {
  if (typeof window === "undefined") return []

  try {
    const data = window.localStorage.getItem(LOCAL_AI_PROVIDERS_KEY)
    const providers = data ? JSON.parse(data) : []
    return Array.isArray(providers) ? providers : []
  } catch {
    return []
  }
}

export function selectBrowserAiProvider(): AIProviderConfig | null {
  return selectChatProvider(readBrowserAiProviders())
}

/** XMZADD 20260722 从浏览器保存的配置中选择会议音频转写服务 */
export function selectBrowserAudioProvider(): AIProviderConfig | null {
  return selectAudioProvider(readBrowserAiProviders())
}

/** XMZADD 20260722 从浏览器保存的配置中选择会议纪要专用的本机 Ollama 服务 */
export function selectBrowserMeetingMinutesProvider(): AIProviderConfig | null {
  return selectMeetingMinutesProvider(readBrowserAiProviders())
}

import { selectChatProvider, type AIProviderConfig } from "@/lib/ai/chat"

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

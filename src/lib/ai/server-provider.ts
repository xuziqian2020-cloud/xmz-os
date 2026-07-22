import { selectChatProvider, type AIProviderConfig } from "@/lib/ai/chat"
import { selectAudioProvider, selectMeetingMinutesProvider, type ProviderPurpose } from "@/lib/ai/provider-selection"
import { createClient } from "@/lib/supabase/server"

/** XMZADD 20260722 按音频或文本用途从本地和持久化配置中选择服务 */
export async function resolveServerProvider(
  localProvider?: AIProviderConfig | null,
  purpose: ProviderPurpose = "chat"
): Promise<AIProviderConfig | null> {
  const selectProvider = purpose === "audio"
    ? selectAudioProvider
    : purpose === "meeting_minutes"
      ? selectMeetingMinutesProvider
      : selectChatProvider
  const selectedLocal = localProvider ? selectProvider([localProvider]) : null
  if (selectedLocal) return selectedLocal

  const supabase = createClient()
  const { data } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  return selectProvider((data || []) as AIProviderConfig[])
}

export function parseProviderJson(value: FormDataEntryValue | null): AIProviderConfig | null {
  if (typeof value !== "string" || !value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

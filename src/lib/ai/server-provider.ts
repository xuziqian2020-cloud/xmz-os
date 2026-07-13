import { selectChatProvider, type AIProviderConfig } from "@/lib/ai/chat"
import { createClient } from "@/lib/supabase/server"

export async function resolveServerProvider(localProvider?: AIProviderConfig | null): Promise<AIProviderConfig | null> {
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

export function parseProviderJson(value: FormDataEntryValue | null): AIProviderConfig | null {
  if (typeof value !== "string" || !value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

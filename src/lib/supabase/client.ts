// Supabase 浏览器端客户端 — 用于客户端组件
import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseConfigError, isSupabaseReady } from "./config"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isSupabaseReady() || !url || !key) {
    throw new Error(getSupabaseConfigError())
  }

  client = createBrowserClient(url, key)
  return client
}

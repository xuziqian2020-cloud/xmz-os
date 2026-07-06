// Supabase 服务端客户端 — 用于 Server Components / Route Handlers
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseConfigError, isSupabaseReady } from "./config"

export function createClient() {
  const cookieStore = cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isSupabaseReady() || !url || !key) {
    throw new Error(getSupabaseConfigError())
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // 服务端组件不能 set cookies — 由 middleware 处理
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // 同上
        }
      },
    },
  })
}

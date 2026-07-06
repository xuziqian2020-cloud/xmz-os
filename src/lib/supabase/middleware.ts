// Supabase Auth 中间件 — 刷新 session cookie
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isSupabaseReady } from "./config"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isSupabaseReady() || !url || !key) {
    // 演示模式下避免用占位配置请求 Supabase。
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options })
        supabaseResponse = NextResponse.next({ request })
        supabaseResponse.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        request.cookies.set({ name, value: "", ...options })
        supabaseResponse = NextResponse.next({ request })
        supabaseResponse.cookies.set({ name, value: "", ...options })
      },
    },
  })

  await supabase.auth.getUser()
  return supabaseResponse
}

// 应用外框布局，负责登录保护和产品级工作区容器
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/supabase/demo"

const publicPaths = ["/login", "/auth/callback"]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [configError, setConfigError] = useState(false)

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const isLoginPage = pathname === "/login"
  const demoMode = isDemoMode()

  useEffect(() => {
    setMounted(true)

    async function checkSession() {
      if (demoMode) {
        setIsAuthed(false)
        setConfigError(true)
        setSessionChecked(true)
        return
      }

      let nextIsAuthed = false
      let nextConfigError = false

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        nextIsAuthed = !!session
      } catch (e: any) {
        // 配置缺失时进入演示浏览，保证本地验收能看到界面。
        if (e.message?.includes("Supabase 环境变量")) {
          nextConfigError = true
        }
      }

      setIsAuthed(nextIsAuthed)
      setConfigError(nextConfigError)
      setSessionChecked(true)

      if (!nextIsAuthed && !isPublic && !nextConfigError) {
        router.push("/login")
      }
    }

    checkSession()

    if (demoMode) return

    try {
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        setIsAuthed(!!session)
      })
      return () => subscription.unsubscribe()
    } catch {
      // 登录监听失败不阻断页面渲染，后续由路由守卫兜底。
    }
  }, [pathname, router, isPublic, demoMode])

  if (isLoginPage || pathname.startsWith("/auth/")) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>
  }

  if (!mounted || !sessionChecked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          加载工作区...
        </div>
      </div>
    )
  }

  if (demoMode || configError || isAuthed) {
    return renderLayout(children)
  }

  return null
}

function renderLayout(children: React.ReactNode) {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.10),transparent_30rem),hsl(var(--background))]">
      <Sidebar />
      <div className="min-h-[100dvh] pl-64">
        <Header />
        <main className="min-h-[calc(100dvh-64px)] px-6 py-6">
          <div className="mx-auto w-full max-w-[1480px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { ADMIN_REMEMBER_FLAG } from "@/lib/auth/local-admin"
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
      const localShortcutAuthed = window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1"
      if (localShortcutAuthed) {
        setIsAuthed(true)
        setConfigError(false)
        setSessionChecked(true)
        return
      }

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
        setIsAuthed(!!session || window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
      })
      return () => subscription.unsubscribe()
    } catch {
      return
    }
  }, [pathname, router, isPublic, demoMode])

  if (isLoginPage || pathname.startsWith("/auth/")) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>
  }

  if (!mounted || !sessionChecked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          正在进入工作台...
        </div>
      </div>
    )
  }

  if (demoMode || configError || isAuthed) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Sidebar />
        <div className="min-h-[100dvh] md:pl-64">
          <Header />
          <main className="min-h-[calc(100dvh-64px)] px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto w-full max-w-[1480px]">{children}</div>
          </main>
        </div>
      </div>
    )
  }

  return null
}

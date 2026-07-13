"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronRight, LogOut, Moon, Sun } from "lucide-react"
import { ADMIN_REMEMBER_FLAG, REMEMBER_CREDENTIALS_KEY } from "@/lib/auth/local-admin"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { mainMenuItems, settingMenuItems, toolMenuItems } from "@/lib/menu-items"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [adminMode, setAdminMode] = useState(false)

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  async function handleLogout() {
    window.localStorage.removeItem(ADMIN_REMEMBER_FLAG)
    window.localStorage.removeItem(REMEMBER_CREDENTIALS_KEY)
    setAdminMode(false)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
    }

    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background">
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" prefetch={false} className="group flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-card shadow-sm transition-transform group-active:scale-[0.98]">
            <img src="/images/xiaomei-avatar.png" alt="小美头像" className="h-full w-full object-cover" />
          </div>
          <span className="min-w-0">
            <span className="block text-base font-semibold">XMZ OS</span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {adminMode ? "徐小美的研发工作台" : "个人研发工作台"}
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <MenuSection label="产品导航" items={mainMenuItems} pathname={pathname} />
        <MenuSection label="智能与工具" items={toolMenuItems} pathname={pathname} />
        <MenuSection label="系统配置" items={settingMenuItems} pathname={pathname} />
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <ThemeToggle />
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-background">
              <img src="/images/xiaomei-avatar.png" alt="小美头像" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{adminMode ? "徐小美" : "开发者"}</p>
              <p className="text-xs text-muted-foreground">个人工作台</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </span>
        </button>
      </div>
    </aside>
  )
}

function MenuSection({
  label,
  items,
  pathname,
}: {
  label: string
  items: typeof mainMenuItems
  pathname: string
}) {
  return (
    <section className="mb-5">
      <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground active:scale-[0.99]"
    >
      <span className="flex items-center gap-3">
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
        <span>{isDark ? "深色模式" : "浅色模式"}</span>
      </span>
      <span className="text-xs text-muted-foreground">切换</span>
    </button>
  )
}

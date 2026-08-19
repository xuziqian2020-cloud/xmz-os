"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronRight, LogOut, Menu, Moon, Sun, X } from "lucide-react"
import { ADMIN_REMEMBER_FLAG } from "@/lib/auth/local-admin"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { mainMenuItems, settingMenuItems, toolMenuItems } from "@/lib/menu-items"
import { UserProfileButton } from "@/components/profile/user-profile-button"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [adminMode, setAdminMode] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    window.localStorage.removeItem(ADMIN_REMEMBER_FLAG)
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
    <>
      <button
        type="button"
        aria-label="打开导航"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      {mobileOpen && <button type="button" aria-label="关闭导航" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/30 md:hidden" />}
      <aside className={cn("fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background transition-transform duration-200 md:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="relative border-b border-border px-5 py-5">
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
        <button
          type="button"
          aria-label="关闭导航菜单"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <MenuSection label="产品导航" items={mainMenuItems} pathname={pathname} />
        <MenuSection label="智能与工具" items={toolMenuItems} pathname={pathname} />
        <MenuSection label="系统配置" items={settingMenuItems} pathname={pathname} />
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <ThemeToggle />
        <div className="rounded-lg border border-border bg-card p-3">
          <UserProfileButton fallbackName={adminMode ? "徐小美" : "开发者"} showText className="w-full p-1" />
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
    </>
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

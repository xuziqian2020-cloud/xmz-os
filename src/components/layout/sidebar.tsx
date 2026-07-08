"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronRight, Moon, Sun } from "lucide-react"
import { ADMIN_REMEMBER_FLAG } from "@/lib/auth/local-admin"
import { cn } from "@/lib/utils"
import { mainMenuItems, settingMenuItems, toolMenuItems } from "@/lib/menu-items"

export function Sidebar() {
  const pathname = usePathname()
  const [adminMode, setAdminMode] = useState(false)

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-sm transition-transform group-active:scale-[0.98]">
            {adminMode ? "小美" : "XMZ"}
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

      <div className="space-y-3 border-t border-slate-200 p-3 dark:border-slate-800">
        <ThemeToggle />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              {adminMode ? "小美" : "XMZ"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{adminMode ? "徐小美" : "开发者"}</p>
              <p className="text-xs text-muted-foreground">{adminMode ? "免密快捷入口" : "工作模式"}</p>
            </div>
          </div>
        </div>
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
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
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

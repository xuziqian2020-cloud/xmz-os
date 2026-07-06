"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronRight, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { mainMenuItems, settingMenuItems, toolMenuItems } from "@/lib/menu-items"

// 产品导航，保持模块入口稳定，提升当前工作区识别度。
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/80 bg-card/95 backdrop-blur-xl">
      <div className="border-b border-border/80 px-5 py-5">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background shadow-sm transition-transform group-active:scale-[0.98]">
            XMZ
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight">XMZ OS</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">个人研发工作台</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <MenuSection label="产品导航" items={mainMenuItems} pathname={pathname} />
        <MenuSection label="智能与工具" items={toolMenuItems} pathname={pathname} />
        <MenuSection label="系统配置" items={settingMenuItems} pathname={pathname} />
      </nav>

      <div className="space-y-3 border-t border-border/80 p-3">
        <ThemeToggle />
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-foreground">演示环境</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">连接 Supabase 后启用真实数据</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))] shadow-[0_0_0_4px_hsl(var(--accent)/0.12)]" />
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
    <section className="mb-6">
      <p className="mb-2 px-2 text-[11px] font-medium text-muted-foreground">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-all duration-200 active:scale-[0.99]",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/75 hover:text-foreground"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground")} />
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
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground active:scale-[0.99]"
    >
      <span className="flex items-center gap-3">
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
        <span>{isDark ? "深色模式" : "浅色模式"}</span>
      </span>
      <span className="text-[11px] text-muted-foreground">切换</span>
    </button>
  )
}

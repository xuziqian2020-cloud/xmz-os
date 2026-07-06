"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronRight, Command, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"

// 顶部工作栏，承载面包屑、全局搜索和高频创建动作。
export function Header() {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1480px] items-center gap-4 px-6">
        <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="面包屑导航">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex min-w-0 items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              {crumb.current ? (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button className="hidden min-w-[320px] items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:flex">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>全局搜索</span>
            </span>
            <span className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-[11px]">
              <Command className="h-3 w-3" />
              K
            </span>
          </button>

          <Link
            href="/plans/new"
            className={cn(
              "inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            )}
          >
            <Plus className="h-4 w-4" />
            快速新增
          </Link>

          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

interface Breadcrumb {
  label: string
  href: string
  current: boolean
}

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: "工作台", href: "/dashboard", current: false }]

  if (pathname === "/dashboard") {
    crumbs[0].current = true
    return crumbs
  }

  const segments = pathname.split("/").filter(Boolean)
  const labelMap: Record<string, string> = {
    dashboard: "工作台",
    projects: "项目",
    plans: "工作计划",
    new: "新增",
    bugs: "Bug 库",
    knowledge: "知识库",
    prompts: "Prompt 库",
    process: "流程图",
    files: "文件",
    ideas: "灵感箱",
    tools: "本地 AI 工具",
    "ai-secretary": "AI 研发秘书",
    "ai-settings": "AI 设置",
    reports: "报表总结",
    settings: "设置",
  }

  let href = ""
  for (const seg of segments) {
    href += `/${seg}`
    crumbs.push({
      label: labelMap[seg] || seg,
      href,
      current: false,
    })
  }

  if (crumbs.length > 0) {
    crumbs[crumbs.length - 1].current = true
  }

  return crumbs
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { usePathname } from "next/navigation"
import {
  Bell,
  BookOpen,
  ChevronRight,
  Command,
  FileText,
  FolderKanban,
  Lightbulb,
  ListChecks,
  Plus,
  Search,
  Terminal,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SearchItem = {
  id: string
  title: string
  subtitle: string
  href: string
  icon: ComponentType<{ className?: string }>
}

type ProjectLite = {
  id: string
  name?: string | null
}

export function Header() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<ProjectLite[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<SearchItem[]>([])

  useEffect(() => {
    fetchJson("/api/projects").then((data) => {
      if (Array.isArray(data)) setProjects(data)
    })
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === "Escape") {
        setSearchOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!searchOpen || items.length > 0) return

    async function loadSearchData() {
      const [projectData, planData, knowledgeData, promptData, ideaData] = await Promise.all([
        fetchJson("/api/projects"),
        fetchJson("/api/work-plans"),
        fetchJson("/api/knowledge"),
        fetchJson("/api/prompts"),
        fetchJson("/api/ideas"),
      ])

      const nextItems: SearchItem[] = []
      appendSearchItems(nextItems, projectData, "项目", "/projects", FolderKanban, "name")
      appendSearchItems(nextItems, planData, "工作计划", "/plans", ListChecks, "title")
      appendSearchItems(nextItems, knowledgeData, "知识库", "/knowledge", BookOpen, "title")
      appendSearchItems(nextItems, promptData, "Prompt", "/prompts", Terminal, "title")
      appendSearchItems(nextItems, ideaData, "灵感", "/ideas", Lightbulb, "title")
      setItems(nextItems)
    }

    loadSearchData()
  }, [searchOpen, items.length])

  const breadcrumbs = useMemo(() => generateBreadcrumbs(pathname, projects), [pathname, projects])
  const searchResults = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return items.slice(0, 8)
    return items
      .filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(keyword))
      .slice(0, 12)
  }, [items, query])

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-[1480px] items-center gap-4 px-6">
          <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="面包屑导航">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                {crumb.current ? (
                  <span className="truncate font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} prefetch={false} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden min-w-[320px] items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:flex"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>全局搜索</span>
              </span>
              <span className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-xs">
                <Command className="h-3 w-3" />
                K
              </span>
            </button>

            <Link
              href="/plans/new"
              prefetch={false}
              className={cn("inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.98]")}
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

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="搜索项目、计划、知识、Prompt、灵感"
                className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">没有找到匹配结果</div>
              ) : (
                searchResults.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={`${item.subtitle}-${item.id}`}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-secondary"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.subtitle}</span>
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface Breadcrumb {
  label: string
  href: string
  current: boolean
}

function generateBreadcrumbs(pathname: string, projects: ProjectLite[]): Breadcrumb[] {
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
    edit: "编辑",
    bugs: "Bug 库",
    knowledge: "知识库",
    prompts: "Prompt 库",
    process: "流程图",
    files: "文件",
    ideas: "灵感箱",
    tools: "本地 AI 工具",
    "ai-secretary": "小美待办雷达",
    "ai-settings": "AI 设置",
    reports: "报表总结",
    settings: "设置",
    learning: "学习中心",
    lessons: "课程",
    practice: "实战",
    notes: "学习笔记",
  }

  let pathHref = ""
  for (let index = 0; index < segments.length; index += 1) {
    const seg = segments[index]
    pathHref += `/${seg}`
    const isProjectId = segments[index - 1] === "projects"
    const project = isProjectId ? projects.find((item) => item.id === seg) : undefined
    crumbs.push({
      label: project?.name || labelMap[seg] || shortenId(seg),
      href: pathHref === "/learning/lessons" ? "/learning" : pathHref,
      current: false,
    })
  }

  crumbs[crumbs.length - 1].current = true
  return crumbs
}

function shortenId(value: string): string {
  if (/^[0-9a-f-]{20,}$/i.test(value)) return "项目详情"
  return value
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function appendSearchItems(
  target: SearchItem[],
  data: any[],
  subtitle: string,
  baseHref: string,
  icon: SearchItem["icon"],
  titleKey: "title" | "name"
) {
  if (!Array.isArray(data)) return

  for (const item of data) {
    const title = item?.[titleKey]
    if (!item?.id || !title) continue
    target.push({
      id: String(item.id),
      title: String(title),
      subtitle,
      href: `${baseHref}/${item.id}`,
      icon,
    })
  }
}

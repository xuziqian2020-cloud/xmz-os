import type { ComponentType } from "react"
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Bug,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  MessageSquareHeart,
  Settings,
  Terminal,
  Wrench,
} from "lucide-react"

export interface MenuItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

export const mainMenuItems: MenuItem[] = [
  { label: "工作台", href: "/dashboard", icon: LayoutDashboard },
  { label: "项目", href: "/projects", icon: FolderKanban },
  { label: "工作计划", href: "/plans", icon: ListTodo },
  { label: "Bug 库", href: "/bugs", icon: Bug },
  { label: "知识库", href: "/knowledge", icon: BookOpen },
  { label: "经验库", href: "/experiences", icon: BookMarked },
  { label: "Prompt 库", href: "/prompts", icon: Terminal },
  { label: "流程图", href: "/process", icon: GitBranch },
  { label: "文件", href: "/files", icon: FileText },
  { label: "灵感箱", href: "/ideas", icon: Lightbulb },
]

export const toolMenuItems: MenuItem[] = [
  { label: "本地 AI 工具", href: "/tools", icon: Wrench },
  { label: "小美待办雷达", href: "/ai-secretary", icon: MessageSquareHeart },
  { label: "报表总结", href: "/reports", icon: BarChart3 },
]

export const settingMenuItems: MenuItem[] = [
  { label: "AI 设置", href: "/ai-settings", icon: Settings },
]

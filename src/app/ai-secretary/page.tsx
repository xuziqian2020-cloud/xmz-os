"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react"
import { ADMIN_REMEMBER_FLAG } from "@/lib/auth/local-admin"
import type { SmartReminder } from "@/lib/database.types"
import { cn } from "@/lib/utils"

type ReminderLike = Partial<SmartReminder> & {
  id: string
  title: string
}

const typeLabels: Record<string, string> = {
  bug_severe: "严重 Bug",
  plan_overdue: "逾期计划",
  plan_due_soon: "即将到期",
  important_plan: "重要计划",
  weekly_candidate: "周报候选",
  custom: "提醒",
}

const demoReminders: ReminderLike[] = [
  {
    id: "today-login",
    reminder_type: "bug_severe",
    title: "登录入口需要优先验证",
    description: "只有输入徐小美时允许免密，admin 不再触发专用入口。",
    created_at: new Date().toISOString(),
  },
  {
    id: "today-search",
    reminder_type: "plan_due_soon",
    title: "全局搜索今天要可点击可返回结果",
    description: "顶部搜索按钮要能搜索项目、计划、知识、Prompt 和灵感。",
    created_at: new Date().toISOString(),
  },
  {
    id: "week-report",
    reminder_type: "weekly_candidate",
    title: "本周研发进展可整理为周报",
    description: "登录、统计、导航和 Word 导出都适合写入本周总结。",
    created_at: new Date().toISOString(),
  },
  {
    id: "week-ai",
    reminder_type: "important_plan",
    title: "AI 设置需要完成供应商配置闭环",
    description: "常用供应商自动带 API 地址，自定义供应商开放名称和地址。",
    created_at: new Date().toISOString(),
  },
]

export default function AISecretaryPage() {
  const [adminMode, setAdminMode] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "我是小美。你可以问我今天先做什么、怎么写周报，或者让我要点式列出风险。" },
  ])

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  const displayName = adminMode ? "徐小美" : "开发者"
  const todayReminders = demoReminders.filter((item) =>
    item.reminder_type === "bug_severe" || item.reminder_type === "plan_overdue" || item.reminder_type === "plan_due_soon"
  )
  const todayIds = new Set(todayReminders.map((item) => item.id))
  const weekReminders = demoReminders.filter((item) =>
    (item.reminder_type === "important_plan" || item.reminder_type === "weekly_candidate") && !todayIds.has(item.id)
  )

  function handleChatSubmit(nextText?: string) {
    const userMessage = (nextText || chatInput).trim()
    if (!userMessage) return

    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }])
    setChatInput("")

    window.setTimeout(() => {
      setChatHistory((prev) => [...prev, { role: "assistant", content: buildReply(userMessage, todayReminders.length, weekReminders.length) }])
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">小美待办雷达</h1>
          <p className="mt-2 text-base text-muted-foreground">按当日和本周拆开提醒，今日已出现的事项不会在本周重复显示。</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">当前账号</p>
          <p className="mt-1 text-base font-semibold">{displayName}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <ReminderSection title="今日待办" count={todayReminders.length} tone="today" reminders={todayReminders} emptyText="今日暂无紧急事项" />
          <ReminderSection title="本周关注" count={weekReminders.length} tone="week" reminders={weekReminders} emptyText="本周暂无额外关注项" />
        </div>

        <section className="flex h-[calc(100dvh-12rem)] min-h-[560px] flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">和小美聊聊</h2>
              <p className="text-sm text-muted-foreground">本地助手先给你整理优先级</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {chatHistory.map((message, index) => (
              <div key={index} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
                    message.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {["今天先做什么", "帮我写周报要点", "有什么风险建议"].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleChatSubmit(suggestion)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleChatSubmit()}
                placeholder="输入你想问小美的问题"
                className="form-input h-12 flex-1 text-base"
              />
              <button
                type="button"
                onClick={() => handleChatSubmit()}
                disabled={!chatInput.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function ReminderSection({
  title,
  count,
  tone,
  reminders,
  emptyText,
}: {
  title: string
  count: number
  tone: "today" | "week"
  reminders: ReminderLike[]
  emptyText: string
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", tone === "today" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300")}>
          {count}
        </span>
      </div>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" />
          <p className="text-base font-medium">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </section>
  )
}

function ReminderCard({ reminder }: { reminder: ReminderLike }) {
  const meta = getReminderMeta(reminder.reminder_type)
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-4">
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.className)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold">{reminder.title}</p>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            {typeLabels[reminder.reminder_type || "custom"] || "提醒"}
          </span>
        </div>
        {reminder.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{reminder.description}</p>}
      </div>
    </div>
  )
}

function getReminderMeta(type?: string | null) {
  if (type === "bug_severe") return { icon: Bug, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" }
  if (type === "plan_overdue") return { icon: AlertTriangle, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" }
  if (type === "plan_due_soon") return { icon: Clock3, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" }
  if (type === "important_plan") return { icon: AlertTriangle, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" }
  if (type === "weekly_candidate") return { icon: FileText, className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" }
  return { icon: MessageSquareText, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" }
}

function buildReply(input: string, todayCount: number, weekCount: number): string {
  if (input.includes("周报")) {
    return `周报可以写四段：本周完成登录入口修正、工作台统计和切换、全局搜索、Word 报表导出；风险是 AI 配置需要继续验证真实 Key；下周建议补数据联动和回归测试。`
  }

  if (input.includes("风险") || input.includes("建议")) {
    return `建议先看三个风险：登录入口是否只认徐小美、全局搜索是否有结果、报表导出的 Word 格式是否能被正常打开。完成后再处理视觉细节。`
  }

  if (input.includes("今天") || input.includes("先做")) {
    return `今天先处理 ${todayCount} 个提醒：登录入口和全局搜索。它们是入口级功能，优先级高于本周剩余 ${weekCount} 个关注项。`
  }

  return "收到。我会按当前待办雷达帮你拆优先级：入口问题先闭环，配置和报表随后验证，最后做视觉细节。"
}

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Send,
} from "lucide-react"
import { ADMIN_REMEMBER_FLAG } from "@/lib/auth/local-admin"
import { selectBrowserAiProvider } from "@/lib/ai/local-providers"
import {
  buildDashboardSummary,
  type DashboardPlanLike,
  type DashboardReminderLike,
} from "@/lib/dashboard/summary"
import { cn } from "@/lib/utils"

const typeLabels: Record<string, string> = {
  bug_severe: "严重 Bug",
  plan_overdue: "逾期计划",
  plan_due_soon: "即将到期",
  important_plan: "重要计划",
  weekly_candidate: "周报候选",
  custom: "提醒",
}

export default function AISecretaryPage() {
  const [adminMode, setAdminMode] = useState(false)
  const [plans, setPlans] = useState<DashboardPlanLike[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "我是小美。你可以问我今天先做什么、怎么写周报，或者让我要点式列出风险。" },
  ])

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPlans() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/work-plans?limit=200", { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "工作计划加载失败")
        if (!cancelled) setPlans(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) {
          setPlans([])
          setError(e.message || "工作计划加载失败")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlans()
    return () => {
      cancelled = true
    }
  }, [])

  const displayName = adminMode ? "徐小美" : "开发者"
  const summary = useMemo(() => buildDashboardSummary(plans), [plans])
  const todayReminders = summary.todayReminders
  const weekReminders = summary.weekReminders

  function handleChatSubmit(nextText?: string) {
    const userMessage = (nextText || chatInput).trim()
    if (!userMessage) return

    const nextHistory: Array<{ role: "user" | "assistant"; content: string }> = [...chatHistory, { role: "user", content: userMessage }]
    setChatHistory(nextHistory)
    setChatInput("")

    fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: nextHistory,
        context: buildChatContext(summary),
        provider: selectBrowserAiProvider(),
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        setChatHistory((prev) => [...prev, { role: "assistant", content: ok ? data.answer : data.error || buildReply(userMessage, todayReminders.length, weekReminders.length) }])
      })
      .catch(() => {
        setChatHistory((prev) => [...prev, { role: "assistant", content: buildReply(userMessage, todayReminders.length, weekReminders.length) }])
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">小美待办雷达</h1>
          <p className="mt-2 text-base text-muted-foreground">按当日和本周拆开提醒，逾期和今日事项也会保留在本周视图里。</p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">当前账号</p>
          <p className="mt-1 text-base font-semibold">{displayName}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <ReminderSection title="今日待办" count={todayReminders.length} tone="today" reminders={todayReminders} emptyText={loading ? "正在读取今日待办..." : "今日暂无紧急事项"} />
          <ReminderSection title="本周关注" count={weekReminders.length} tone="week" reminders={weekReminders} emptyText={loading ? "正在读取本周待办..." : "本周暂无额外关注项"} />
        </div>

        <section className="flex h-[calc(100dvh-12rem)] min-h-[560px] flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <div className="h-11 w-11 overflow-hidden rounded-full border border-border bg-background">
              <img src="/images/xiaomei-avatar.png" alt="小美头像" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">和小美聊聊</h2>
              <p className="text-sm text-muted-foreground">本地助手按重要程度和截止日期整理</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {chatHistory.map((message, index) => (
              <div key={index} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                {message.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-background">
                    <img src="/images/xiaomei-avatar.png" alt="" className="h-full w-full object-cover" />
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
  reminders: DashboardReminderLike[]
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

function ReminderCard({ reminder }: { reminder: DashboardReminderLike }) {
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
    return `周报可以按三段写：本周推进了哪些计划、今日或逾期事项如何处理、下周还剩 ${weekCount} 个关注项要继续跟进。`
  }

  if (input.includes("风险") || input.includes("建议")) {
    return `建议先看今日 ${todayCount} 个待办和本周 ${weekCount} 个关注项，逾期和本周重要计划排在普通计划前面。`
  }

  if (input.includes("今天") || input.includes("先做")) {
    return todayCount > 0 ? `今天先处理 ${todayCount} 个提醒，再按本周队列继续推进。` : `今天没有紧急提醒，可以从本周 ${weekCount} 个关注项里挑重要计划推进。`
  }

  return `收到。我会按当前待办雷达帮你拆推进顺序：今日 ${todayCount} 项优先，本周 ${weekCount} 项按重要程度和截止日期推进。`
}

function buildChatContext(summary: ReturnType<typeof buildDashboardSummary>): string {
  const today = summary.todayReminders.map((item) => `${item.title}：${item.description}`).join("；") || "无"
  const week = summary.weekReminders.map((item) => `${item.title}：${item.description}`).join("；") || "无"
  return `今日待办 ${summary.todayPlans.length} 项：${today}；本周待办 ${summary.weekPlans.length} 项：${week}；本周重要 ${summary.importantCount} 项；本周未完成 ${summary.unfinishedCount} 项；平均进度 ${summary.averageProgress}%。`
}

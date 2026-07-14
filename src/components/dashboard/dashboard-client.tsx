"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  Gauge,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  X,
} from "lucide-react"
import { PlanCompletionSelect, PlanPrioritySelect } from "@/components/plans/plan-status-select"
import { UserProfileButton } from "@/components/profile/user-profile-button"
import { selectBrowserAiProvider } from "@/lib/ai/local-providers"
import {
  ASSISTANT_COMMANDS,
  buildAssistantCreateRequest,
  detectAssistantCommand,
  getMissingCreateInfoMessage,
} from "@/lib/assistant/commands"
import { formatAssistantSqlQueryResult } from "@/lib/assistant/sql"
import { ADMIN_REMEMBER_FLAG, buildLocalAdminHeaders } from "@/lib/auth/local-admin"
import {
  buildDashboardSummary,
  normalizeProgress,
  type DashboardViewMode,
  type DashboardPlanLike,
  type DashboardReminderLike,
  type DashboardSummary,
} from "@/lib/dashboard/summary"
import { cn } from "@/lib/utils"

type IconComponent = ComponentType<{ className?: string }>
type ChatMessage = { role: "user" | "assistant"; content: string }

const quickActions: Array<{ label: string; desc: string; href: string; icon: IconComponent }> = [
  { label: "新建需求", desc: "记录业务需求和验收点", href: "/plans/new?type=requirement", icon: ListChecks },
  { label: "登记 Bug", desc: "记录问题、原因和修复", href: "/plans/new?type=bug", icon: Bug },
  { label: "写知识", desc: "沉淀接口、方案和结论", href: "/knowledge/new", icon: BookOpen },
  { label: "写 Prompt", desc: "保存常用提示词", href: "/prompts/new", icon: TerminalSquare },
  { label: "记灵感", desc: "先收集想法再整理", href: "/ideas/new", icon: Lightbulb },
]

export function DashboardClient({
  initialPlans,
  initialError = "",
}: {
  initialPlans: DashboardPlanLike[]
  initialError?: string
}) {
  const [adminMode, setAdminMode] = useState(false)
  const [viewMode, setViewMode] = useState<DashboardViewMode>("today")
  const [plans, setPlans] = useState<DashboardPlanLike[]>(initialPlans)
  const [loading] = useState(false)
  const [error] = useState(initialError)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: "assistant", content: "我是小美。你可以问我今天先做什么、哪些本周事项需要提前处理。" },
  ])

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  const summary = useMemo(() => buildDashboardSummary(plans), [plans])
  const displayName = adminMode ? "徐小美" : "开发者"
  const shownPlans = viewMode === "today" ? summary.todayPlans : viewMode === "week" ? summary.weekPlans : summary.inProgressPlans
  const currentMetrics = summary.metrics[viewMode]
  const currentDate = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  const radarSummary = useMemo(() => {
    if (loading) return "正在读取真实工作计划，稍后会按今天和本周自动拆分。"
    if (summary.todayReminders.length > 0) return `今天有 ${summary.todayReminders.length} 个待办提醒，建议先处理今日截止和仍在进行中的逾期事项。`
    if (summary.weekReminders.length > 0) return `本周还有 ${summary.weekReminders.length} 个关注项，可以按截止日期推进。`
    return "当前没有今日或本周提醒，可以继续按计划推进。"
  }, [loading, summary.todayReminders.length, summary.weekReminders.length])

  async function handleChatSubmit(event?: FormEvent<HTMLFormElement>, preset?: string) {
    event?.preventDefault()
    const text = (preset || chatInput).trim()
    if (!text) return

    const nextHistory: ChatMessage[] = [...chatHistory, { role: "user", content: text }]
    setChatHistory(nextHistory)
    setChatInput("")

    try {
      const command = detectAssistantCommand(text)
      if (command) {
        if (command.action === "query") {
          const res = await fetch(`/api/assistant/query?text=${encodeURIComponent(text)}`, { cache: "no-store", headers: buildLocalAdminHeaders(isRememberedAdmin()) })
          const data = await res.json()
          setChatHistory((prev) => [...prev, { role: "assistant", content: res.ok ? formatAssistantSqlQueryResult(data.sql, data.resultLabel, Array.isArray(data.rows) ? data.rows : []) : formatQueryFailure(data, command.label) }])
          return
        } else {
          const request = buildAssistantCreateRequest(command)
          if (!request) {
            setChatHistory((prev) => [...prev, { role: "assistant", content: getMissingCreateInfoMessage(command) }])
            return
          }
          const res = await fetch(request.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.body),
          })
          const data = await res.json()
          if (res.ok && request.endpoint === "/api/work-plans") setPlans((prev) => [data, ...prev])
          setChatHistory((prev) => [...prev, { role: "assistant", content: res.ok ? `已完成${command.label}：${data.title || request.body.title}。` : data.error || `${command.label}失败` }])
          return
        }
      }

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory,
          context: buildChatContext(summary),
          provider: selectBrowserAiProvider(),
        }),
      })
      const data = await res.json()
      const content = res.ok ? data.answer : data.error || buildReply(text, summary)
      setChatHistory((prev) => [...prev, { role: "assistant", content }])
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", content: buildReply(text, summary) }])
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-[hsl(var(--accent))]">研发工作台</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-normal">你好，{displayName}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  优先处理会影响进入系统、上线节奏和知识沉淀的事项。今天看执行，本周看节奏。
                </p>
              </div>
              <div className="w-full rounded-lg border border-border bg-background p-4 lg:w-72">
                <p className="text-sm font-medium text-muted-foreground">今日日期</p>
                <p className="mt-2 text-base font-medium">{currentDate}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
                  <span>{adminMode ? "个人工作账号" : "工作模式"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={CalendarDays} label="计划" value={loading ? "..." : String(currentMetrics.planCount)} hint={getViewHint(viewMode, "plan")} />
              <MetricCard icon={AlertTriangle} label="重要" value={loading ? "..." : String(currentMetrics.importantCount)} hint={getViewHint(viewMode, "important")} />
              <MetricCard icon={Clock3} label="未完成" value={loading ? "..." : String(currentMetrics.unfinishedCount)} hint={getViewHint(viewMode, "unfinished")} />
              <MetricCard icon={Gauge} label="进度" value={loading ? "..." : `${currentMetrics.averageProgress}%`} hint={getViewHint(viewMode, "progress")} />
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserProfileButton fallbackName={displayName} />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI 研发秘书</p>
                  <h2 className="mt-1 text-xl font-semibold">小美待办雷达</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                去对话
              </button>
            </div>

            <p className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm leading-6 text-foreground">
              {radarSummary}
            </p>

            <RadarList title="今日待办" reminders={summary.todayReminders} emptyText={loading ? "正在读取今日待办..." : "今日无紧急提醒"} />
            <RadarList title="本周待办" reminders={summary.weekReminders} emptyText={loading ? "正在读取本周待办..." : "本周暂无额外提醒"} />
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">推进队列</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {viewMode === "today" ? "今天截止的计划，以及仍在进行中的逾期计划" : viewMode === "week" ? "本周截止的计划，过期已完成事项不再显示" : "所有仍在进行中的任务，不受截止日期限制"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border bg-secondary p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("today")}
                    className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "today" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    今日
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    本周
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("inProgress")}
                    className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "inProgress" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    进行中
                  </button>
                </div>
                <Link href="/plans" prefetch={false} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  查看全部
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {loading ? (
                <DashboardEmpty text="正在读取真实工作计划..." />
              ) : shownPlans.length === 0 ? (
                <DashboardEmpty text={viewMode === "today" ? "今天没有截止计划，也没有进行中的逾期计划" : viewMode === "week" ? "本周没有截止计划" : "当前没有进行中的任务"} />
              ) : (
                shownPlans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} onPlanSaved={(updated) => setPlans((prev) => prev.map((item) => item.id === updated.id ? updated : item))} />
                ))
              )}
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-xl font-semibold">快速新增</h2>
              <p className="mt-1 text-sm text-muted-foreground">把临时事项放进正确模块</p>
              <div className="mt-4 grid gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      prefetch={false}
                      className="group flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:text-[hsl(var(--accent))]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base font-medium">{action.label}</span>
                          <span className="mt-0.5 block truncate text-sm text-muted-foreground">{action.desc}</span>
                        </span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[hsl(var(--accent))]" />
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">项目总览</h2>
              <p className="mt-1 text-sm text-muted-foreground">直接进入常用工作区</p>
            </div>
            <Link href="/projects" prefetch={false} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              管理项目
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ProjectTile icon={FolderKanban} title="XMZ OS" desc="个人研发工作台" href="/projects" />
            <ProjectTile icon={ListChecks} title="工作计划" desc="需求、Bug、自定义计划" href="/plans" />
            <ProjectTile icon={FileText} title="报表总结" desc="日报、周报、月报、年报" href="/reports" />
            <ProjectTile icon={MessageSquareText} title="小美待办雷达" desc="提醒和对话入口" href="/ai-secretary" />
          </div>
        </section>
      </div>

      <ChatDrawer
        open={chatOpen}
        input={chatInput}
        history={chatHistory}
        summary={summary}
        onClose={() => setChatOpen(false)}
        onInputChange={setChatInput}
        onSubmit={handleChatSubmit}
      />
    </>
  )
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: IconComponent; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}

function PlanRow({ plan, onPlanSaved }: { plan: DashboardPlanLike; onPlanSaved: (plan: any) => void }) {
  const type = getTypeMeta(plan.type)
  const priority = getPriorityMeta(plan.priority)
  const progress = normalizeProgress(plan.progress)

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:border-[hsl(var(--accent)/0.45)] lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", type.className)}>{type.label}</span>
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", priority.className)}>{priority.label}</span>
        </div>
        <Link href={`/plans/${plan.id}`} prefetch={false} className="mt-3 block truncate text-base font-semibold hover:text-[hsl(var(--accent))]">
          {plan.title}
        </Link>
        {plan.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>}
      </div>
      <div className="flex flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PlanPrioritySelect planId={plan.id} type={plan.type} priority={plan.priority} onSaved={onPlanSaved} />
            <PlanCompletionSelect planId={plan.id} type={plan.type} status={plan.status} progress={plan.progress} onSaved={onPlanSaved} />
          </div>
          <span className="text-sm text-muted-foreground">{plan.due_date || "未设截止"}</span>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>进度</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div className="h-full rounded-full bg-[hsl(var(--accent))] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RadarList({ title, reminders, emptyText }: { title: string; reminders: DashboardReminderLike[]; emptyText: string }) {
  return (
    <div className="mt-5">
      <p className="mb-3 text-sm font-semibold text-muted-foreground">{title}</p>
      {reminders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderItem key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReminderItem({ reminder }: { reminder: DashboardReminderLike }) {
  const meta = getReminderMeta(reminder.reminder_type)
  const Icon = meta.icon

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.className)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{reminder.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{reminder.description}</p>
        </div>
      </div>
    </div>
  )
}

function ChatDrawer({
  open,
  input,
  history,
  summary,
  onClose,
  onInputChange,
  onSubmit,
}: {
  open: boolean
  input: string
  history: ChatMessage[]
  summary: DashboardSummary
  onClose: () => void
  onInputChange: (value: string) => void
  onSubmit: (event?: FormEvent<HTMLFormElement>, preset?: string) => void
}) {
  const [commandsOpen, setCommandsOpen] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/45" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-[440px] flex-col border-l border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <UserProfileButton fallbackName="徐小美" />
            <div>
              <h2 className="text-xl font-semibold">和小美聊聊</h2>
              <p className="text-sm text-muted-foreground">今日 {summary.todayPlans.length} 项，本周 {summary.weekPlans.length} 项</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {history.map((message, index) => (
            <div key={index} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
              {message.role === "assistant" && (
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-background">
                  <img src="/images/xiaomei-avatar.png" alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
                  message.role === "user" ? "bg-[hsl(var(--accent))] text-white" : "bg-secondary text-foreground"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={(event) => onSubmit(event)} className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => setCommandsOpen((open) => !open)}
            className="mb-3 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {commandsOpen ? "收起指令" : "指令"}
          </button>
          {commandsOpen && (
            <div className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
              {ASSISTANT_COMMANDS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onInputChange(item.prompt)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="输入你想问小美的问题"
              className="form-input h-12 flex-1 text-base"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-white transition-colors hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

function isRememberedAdmin(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1"
}

function formatQueryFailure(data: any, fallbackLabel: string): string {
  if (!data?.sql) return data?.error || `${fallbackLabel}失败`
  return `${formatAssistantSqlQueryResult(data.sql, data.resultLabel || fallbackLabel, Array.isArray(data.rows) ? data.rows : [])}\n\n查询失败：${data.error || `${fallbackLabel}失败`}`
}

function ProjectTile({ icon: Icon, title, desc, href }: { icon: IconComponent; title: string; desc: string; href: string }) {
  return (
    <Link href={href} prefetch={false} className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-[hsl(var(--accent)/0.45)]">
      <Icon className="h-6 w-6 text-[hsl(var(--accent))]" />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
    </Link>
  )
}

function DashboardEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function getViewHint(viewMode: DashboardViewMode, metric: "plan" | "important" | "unfinished" | "progress"): string {
  const prefix = viewMode === "today" ? "今日" : viewMode === "week" ? "本周" : "进行中"
  if (metric === "plan") return `${prefix}范围内的计划数量`
  if (metric === "important") return `${prefix}范围内的重要计划数量`
  if (metric === "unfinished") return `${prefix}范围内仍需推进`
  if (viewMode === "inProgress") return "进行中范围固定按 0% 展示"
  return `${prefix}范围内已完成数量占计划总数的比例`
}

function buildReply(input: string, summary: DashboardSummary): string {
  if (input.includes("风险")) {
    return `本周风险先看 ${summary.unfinishedCount} 个本周未完成事项，优先检查今天截止、仍在进行中的逾期事项和本周重要计划。本周进度是 ${summary.averageProgress}%，低于预期的计划建议今天补动作。`
  }

  if (input.includes("顺序") || input.includes("先做") || input.includes("今天")) {
    if (summary.todayPlans.length === 0) return "今天没有截止计划，也没有进行中的逾期计划，可以从本周重要计划开始推进。"
    return `今天先处理 ${summary.todayPlans.length} 个事项：${summary.todayPlans.slice(0, 3).map((plan) => plan.title).join("、")}。先处理进行中的逾期项和重要项，再补普通计划。`
  }

  return `当前本周有 ${summary.weekPlans.length} 个计划，本周重要 ${summary.importantCount} 个，本周未完成 ${summary.unfinishedCount} 个。建议按重要程度和截止日期推进。`
}

function buildChatContext(summary: DashboardSummary): string {
  const today = summary.todayPlans.map((plan) => `${plan.title}(${plan.due_date || "未设截止"})`).join("、") || "无"
  const week = summary.weekPlans.map((plan) => `${plan.title}(${plan.due_date || "未设截止"})`).join("、") || "无"
  return `今日计划 ${summary.todayPlans.length} 项：${today}；本周计划 ${summary.weekPlans.length} 项：${week}；本周重要 ${summary.importantCount} 项；本周未完成 ${summary.unfinishedCount} 项；本周进度 ${summary.averageProgress}%。`
}

function getTypeMeta(type?: string | null) {
  if (type === "bug") return { label: "Bug", className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (type === "requirement") return { label: "需求", className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" }
  return { label: "自定义", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" }
}

function getPriorityMeta(priority?: string | null) {
  if (priority === "high") return { label: "重要", className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (priority === "low") return { label: "低", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" }
  return { label: "中等", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
}

function getReminderMeta(type: DashboardReminderLike["reminder_type"]) {
  if (type === "bug_severe") return { icon: Bug, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (type === "plan_overdue") return { icon: AlertTriangle, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
  if (type === "important_plan") return { icon: AlertTriangle, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (type === "plan_due_soon") return { icon: Clock3, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
  if (type === "weekly_candidate") return { icon: FileText, className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" }
  return { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" }
}

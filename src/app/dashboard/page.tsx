"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react"
import { PlanStatusSelect } from "@/components/plans/plan-status-select"
import { ADMIN_REMEMBER_FLAG } from "@/lib/auth/local-admin"
import { cn } from "@/lib/utils"
import type { SmartReminder, WorkPlan } from "@/lib/database.types"

type PlanLike = Partial<WorkPlan> & {
  id: string
  title: string
}

type ReminderLike = Partial<SmartReminder> & {
  id: string
  title: string
}

type IconComponent = ComponentType<{ className?: string }>

const demoTodayPlans: PlanLike[] = [
  {
    id: "demo-login",
    title: "修正徐小美免密登录入口",
    type: "bug",
    priority: "high",
    status: "重要",
    progress: 35,
    due_date: "今天",
    description: "只有输入徐小美时允许免密，admin 不再触发专用入口。",
  },
  {
    id: "demo-search",
    title: "让全局搜索可用",
    type: "requirement",
    priority: "high",
    status: "重要",
    progress: 45,
    due_date: "今天",
    description: "搜索项目、计划、知识、Prompt 和灵感，避免入口只是摆设。",
  },
]

const demoWeekPlans: PlanLike[] = [
  ...demoTodayPlans,
  {
    id: "demo-report",
    title: "报表导出支持 Word 文档格式",
    type: "custom",
    priority: "medium",
    status: "中等",
    progress: 60,
    due_date: "周四",
    description: "日报、周报、月报、年报都能切换预览并导出 Word 可打开的文章格式。",
  },
  {
    id: "demo-ai-setting",
    title: "AI 设置按常用供应商快速配置",
    type: "requirement",
    priority: "medium",
    status: "中等",
    progress: 55,
    due_date: "周五",
    description: "选择供应商后自动带出 API 地址，只输入 Key 和模型即可。",
  },
  {
    id: "demo-polish",
    title: "统一工作台中文字号和视觉层级",
    type: "custom",
    priority: "low",
    status: "低",
    progress: 30,
    due_date: "周五",
    description: "减少无关说明，提升主要信息可读性。",
  },
]

const demoReminders: ReminderLike[] = [
  {
    id: "today-login",
    reminder_type: "bug_severe",
    title: "登录入口需要优先验证",
    description: "入口错误会直接影响进入工作台，今天先闭环。",
  },
  {
    id: "today-search",
    reminder_type: "plan_due_soon",
    title: "全局搜索今天要可点击可返回结果",
    description: "顶部搜索按钮要能打开并检索核心数据。",
  },
  {
    id: "week-report",
    reminder_type: "weekly_candidate",
    title: "本周适合整理成周报",
    description: "登录、统计、导航和报表导出都有明确产出。",
  },
  {
    id: "week-ai",
    reminder_type: "important_plan",
    title: "AI 设置本周需要完成配置闭环",
    description: "常用供应商和自定义供应商都要能保存。",
  },
]

const quickActions: Array<{ label: string; desc: string; href: string; icon: IconComponent }> = [
  { label: "新建需求", desc: "记录业务需求和验收点", href: "/plans/new?type=requirement", icon: ListChecks },
  { label: "登记 Bug", desc: "记录问题、原因和修复", href: "/plans/new?type=bug", icon: Bug },
  { label: "写知识", desc: "沉淀接口、方案和结论", href: "/knowledge/new", icon: BookOpen },
  { label: "写 Prompt", desc: "保存常用提示词", href: "/prompts/new", icon: TerminalSquare },
  { label: "记灵感", desc: "先收集想法再整理", href: "/ideas/new", icon: Lightbulb },
]

export default function DashboardPage() {
  const [adminMode, setAdminMode] = useState(false)
  const [viewMode, setViewMode] = useState<"today" | "week">("today")

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  const displayName = adminMode ? "徐小美" : "开发者"
  const shownPlans = viewMode === "today" ? demoTodayPlans : demoWeekPlans
  const weekPlans = demoWeekPlans
  const todayReminders = demoReminders.filter((item) =>
    item.reminder_type === "bug_severe" || item.reminder_type === "plan_overdue" || item.reminder_type === "plan_due_soon"
  )
  const todayReminderIds = new Set(todayReminders.map((item) => item.id))
  const weekReminders = demoReminders.filter((item) =>
    (item.reminder_type === "important_plan" || item.reminder_type === "weekly_candidate") && !todayReminderIds.has(item.id)
  )

  const importantCount = weekPlans.filter((plan) => plan.priority === "high" || plan.status === "重要").length
  const unfinishedCount = weekPlans.filter((plan) => !isFinished(plan.status)).length
  const averageProgress = getAverageProgress(weekPlans)
  const currentDate = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  const radarSummary = useMemo(() => {
    if (todayReminders.length > 0) return `今天有 ${todayReminders.length} 个提醒，建议先处理登录和搜索。`
    if (weekReminders.length > 0) return `本周还有 ${weekReminders.length} 个关注项，可以按计划推进。`
    return "当前没有紧急提醒，可以继续按计划推进。"
  }, [todayReminders.length, weekReminders.length])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">研发工作台</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-normal">你好，{displayName}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                优先处理会影响进入系统、上线节奏和知识沉淀的事项。今天看执行，本周看节奏。
              </p>
            </div>
            <div className="w-full rounded-lg border border-border bg-secondary/50 p-4 lg:w-72">
              <p className="text-sm font-medium text-muted-foreground">今日日期</p>
              <p className="mt-2 text-base font-medium">{currentDate}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>{adminMode ? "徐小美账号" : "演示数据"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={CalendarDays} label="本周计划" value={String(weekPlans.length)} hint="按本周口径计算" />
            <MetricCard icon={AlertTriangle} label="重要事项" value={String(importantCount)} hint="重要程度为重要" />
            <MetricCard icon={Clock3} label="未完成" value={String(unfinishedCount)} hint="本周仍需推进" />
            <MetricCard icon={Gauge} label="平均进度" value={`${averageProgress}%`} hint="按本周计划平均" />
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI 研发秘书</p>
                <h2 className="mt-1 text-xl font-semibold">小美待办雷达</h2>
              </div>
            </div>
            <Link href="/ai-secretary" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              去对话
            </Link>
          </div>

          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            {radarSummary}
          </p>

          <RadarList title="今日" reminders={todayReminders} emptyText="今日无紧急提醒" />
          <RadarList title="本周" reminders={weekReminders} emptyText="本周暂无额外提醒" />
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">推进队列</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {viewMode === "today" ? "今天要闭环或推进的事项" : "本周计划，今日事项不会被隐藏"}
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
              </div>
              <Link href="/plans" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                查看全部
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {shownPlans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
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
                    className="group flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:text-emerald-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-medium">{action.label}</span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{action.desc}</span>
                      </span>
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-600" />
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
            <p className="mt-1 text-sm text-muted-foreground">替代无用的项目沙箱，直接进入常用工作区</p>
          </div>
          <Link href="/projects" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
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
  )
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: IconComponent; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}

function PlanRow({ plan }: { plan: PlanLike }) {
  const type = getTypeMeta(plan.type)
  const priority = getPriorityMeta(plan.priority, plan.status)
  const progress = normalizeProgress(plan.progress)

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:border-emerald-500/40 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", type.className)}>{type.label}</span>
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", priority.className)}>{priority.label}</span>
        </div>
        <Link href={`/plans/${plan.id}`} className="mt-3 block truncate text-base font-semibold hover:text-emerald-600">
          {plan.title}
        </Link>
        {plan.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>}
      </div>
      <div className="flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <PlanStatusSelect planId={plan.id} type={plan.type} status={plan.status} priority={plan.priority} progress={plan.progress} />
          <span className="text-sm text-muted-foreground">{plan.due_date || "未设截止"}</span>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>进度</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RadarList({ title, reminders, emptyText }: { title: string; reminders: ReminderLike[]; emptyText: string }) {
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

function ReminderItem({ reminder }: { reminder: ReminderLike }) {
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
          {reminder.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{reminder.description}</p>}
        </div>
      </div>
    </div>
  )
}

function ProjectTile({ icon: Icon, title, desc, href }: { icon: IconComponent; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-emerald-500/40">
      <Icon className="h-6 w-6 text-emerald-600" />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
    </Link>
  )
}

function getAverageProgress(plans: PlanLike[]) {
  if (plans.length === 0) return 0
  let total = 0
  for (const plan of plans) {
    total += normalizeProgress(plan.progress)
  }
  return Math.round(total / plans.length)
}

function normalizeProgress(progress: PlanLike["progress"]) {
  if (typeof progress !== "number") return 0
  if (progress < 0) return 0
  if (progress > 100) return 100
  return Math.round(progress)
}

function isFinished(status: PlanLike["status"]) {
  return status === "已完成" || status === "已上线" || status === "已归档"
}

function getTypeMeta(type: PlanLike["type"]) {
  if (type === "bug") return { label: "Bug", className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (type === "requirement") return { label: "需求", className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" }
  return { label: "自定义", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" }
}

function getPriorityMeta(priority?: string | null, status?: string | null) {
  if (priority === "high" || status === "重要") return { label: "重要", className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (priority === "low" || status === "低") return { label: "低", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" }
  return { label: "中等", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
}

function getReminderMeta(type: ReminderLike["reminder_type"]) {
  if (type === "bug_severe") return { icon: Bug, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (type === "plan_overdue") return { icon: AlertTriangle, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
  if (type === "important_plan") return { icon: AlertTriangle, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" }
  if (type === "plan_due_soon") return { icon: Clock3, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
  if (type === "weekly_candidate") return { icon: FileText, className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" }
  return { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" }
}

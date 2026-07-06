import Link from "next/link"
import type { ComponentType } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Plus,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react"
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

const demoReminders: ReminderLike[] = [
  {
    id: "demo-risk-login",
    reminder_type: "bug_severe",
    title: "登录页验证链路需要优先收口",
    description: "当前入口影响用户进入工作台，建议先完成错误态、重发入口和配置提示。",
  },
  {
    id: "demo-plan-doc",
    reminder_type: "plan_overdue",
    title: "API 接口文档整理已经超过计划时间",
    description: "上线前需要把核心接口、权限边界和字段说明补齐，避免后续联调返工。",
  },
  {
    id: "demo-weekly",
    reminder_type: "weekly_candidate",
    title: "本周已有可整理成周报的研发进展",
    description: "建议把修复、重构和上线准备按项目归档，方便后续复盘。",
  },
]

const demoTodayPlans: PlanLike[] = [
  {
    id: "demo-login",
    title: "重构登录页与演示环境进入链路",
    type: "bug",
    priority: "high",
    status: "处理中",
    progress: 64,
    due_date: "今天",
    description: "先保证本地和正式环境都能稳定进入工作台。",
  },
  {
    id: "demo-dashboard",
    title: "完成 XMZ OS 工作台视觉升级",
    type: "requirement",
    priority: "high",
    status: "开发中",
    progress: 78,
    due_date: "今天",
    description: "把首页改成研发指挥中心，突出待办、项目和快速捕获。",
  },
  {
    id: "demo-knowledge",
    title: "沉淀上线前配置清单",
    type: "custom",
    priority: "medium",
    status: "未开始",
    progress: 22,
    due_date: "今天",
    description: "整理 Supabase、Netlify、环境变量和权限检查项。",
  },
]

const demoWeekPlans: PlanLike[] = [
  {
    id: "demo-week-tests",
    title: "补齐登录、工作台和项目列表的回归检查",
    type: "custom",
    priority: "medium",
    status: "进行中",
    progress: 46,
    due_date: "周三",
  },
  {
    id: "demo-week-project",
    title: "项目沙箱支持按状态筛选和归档",
    type: "requirement",
    priority: "medium",
    status: "待开发",
    progress: 18,
    due_date: "周五",
  },
  {
    id: "demo-week-report",
    title: "生成周报摘要模板",
    type: "custom",
    priority: "low",
    status: "待确认",
    progress: 10,
    due_date: "周五",
  },
]

const quickActions: Array<{
  label: string
  desc: string
  href: string
  icon: IconComponent
}> = [
  { label: "工作计划", desc: "需求、任务、日程", href: "/plans/new", icon: ListChecks },
  { label: "Bug 记录", desc: "故障、原因、方案", href: "/plans/new?type=bug", icon: Bug },
  { label: "知识沉淀", desc: "接口、方案、结论", href: "/knowledge/new", icon: BookOpen },
  { label: "Prompt 模板", desc: "常用提示词资产", href: "/prompts/new", icon: TerminalSquare },
  { label: "灵感捕获", desc: "想法先入库", href: "/ideas/new", icon: Lightbulb },
]

const projectCards = [
  {
    title: "XMZ OS",
    desc: "个人研发操作系统，先把登录、首页和上线链路打稳。",
    href: "/projects",
    status: "当前主线",
    metric: "3 个重点",
    icon: Code2,
  },
  {
    title: "AI 研发秘书",
    desc: "把提醒、周报、知识串联成可执行的研发辅助流。",
    href: "/ai-secretary",
    status: "能力孵化",
    metric: "10 条提醒",
    icon: MessageSquareText,
  },
  {
    title: "知识资产库",
    desc: "把项目文档、接口说明、Prompt 和复盘统一归档。",
    href: "/knowledge",
    status: "持续沉淀",
    metric: "待补结构",
    icon: FolderKanban,
  },
]

export default async function DashboardPage() {
  let user: { email?: string | null } | null = null
  let todayPlans: PlanLike[] = []
  let weekPlans: PlanLike[] = []
  let reminders: ReminderLike[] = []

  try {
    const dashboardData = await import("@/lib/data/dashboard")
    user = await dashboardData.getUser()
    const results = await Promise.all([
      dashboardData.getTodayPlans(),
      dashboardData.getWeekPlans(),
      dashboardData.getActiveReminders(),
    ])
    todayPlans = results[0]
    weekPlans = results[1]
    reminders = results[2]
  } catch {
    // 本地未配置 Supabase 时使用演示数据，保证界面验收和产品判断不中断。
    todayPlans = demoTodayPlans
    weekPlans = demoWeekPlans
    reminders = demoReminders
  }

  const userName = user?.email?.split("@")[0] ?? "XMZ"
  const allPlans = mergePlans(todayPlans, weekPlans)
  const highPriorityCount = allPlans.filter((plan) => plan.priority === "high").length
  const activeCount = allPlans.filter((plan) => !isFinished(plan.status)).length
  const averageProgress = getAverageProgress(allPlans)
  const currentDate = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="surface-panel rounded-lg p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">
                研发指挥中心
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
                你好，{userName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                这里聚合今天要推进的计划、风险提醒和项目入口。优先处理会影响进入系统、上线节奏和知识沉淀的事项。
              </p>
            </div>
            <div className="w-full rounded-lg border border-border bg-secondary/50 p-4 lg:w-64">
              <p className="text-xs text-muted-foreground">今日日期</p>
              <p className="mt-2 text-sm font-medium text-foreground">{currentDate}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
                <span>演示数据可直接预览，接入 Supabase 后自动切换真实数据。</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={CalendarDays} label="今日推进" value={String(todayPlans.length)} hint="需要今天闭环" />
            <MetricCard icon={AlertTriangle} label="高优先级" value={String(highPriorityCount)} hint="先处理阻塞项" />
            <MetricCard icon={Clock3} label="本周计划" value={String(weekPlans.length)} hint="按节奏推进" />
            <MetricCard icon={Gauge} label="平均进度" value={`${averageProgress}%`} hint={`${activeCount} 个未完成`} />
          </div>
        </div>

        <section className="surface-panel rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">AI 研发秘书</p>
              <h2 className="mt-1 text-lg font-semibold">小美待办雷达</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-[hsl(var(--accent))]">
              <MessageSquareText className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reminders.length === 0 ? (
              <DashboardEmpty
                icon={CheckCircle2}
                title="暂时没有风险提醒"
                desc="当前没有逾期、严重 Bug 或周报候选提醒。"
              />
            ) : (
              reminders.slice(0, 4).map((reminder) => (
                <ReminderItem key={reminder.id} reminder={reminder} />
              ))
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface-panel rounded-lg p-5">
          <SectionHeader
            title="今日推进队列"
            desc="按优先级处理最影响研发节奏的事项"
            actionLabel="查看全部"
            href="/plans"
          />

          <div className="mt-4 space-y-2">
            {todayPlans.length === 0 ? (
              <DashboardEmpty
                icon={ListChecks}
                title="今天还没有计划"
                desc="可以先创建一个工作计划，把下一步行动放进队列。"
              />
            ) : (
              todayPlans.slice(0, 6).map((plan) => (
                <PlanRow key={plan.id} plan={plan} />
              ))
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="surface-panel rounded-lg p-5">
            <SectionHeader title="快速捕获" desc="把临时事项先放进正确模块" />
            <div className="mt-4 grid gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center justify-between rounded-md border border-border bg-card px-3 py-3 text-sm transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary/60"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-[hsl(var(--accent))]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-foreground">{action.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{action.desc}</span>
                      </span>
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[hsl(var(--accent))]" />
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="surface-panel rounded-lg p-5">
            <SectionHeader title="本周节奏" desc="避免计划漂移和临时事项失控" />
            <div className="mt-4 space-y-3">
              {weekPlans.length === 0 ? (
                <DashboardEmpty
                  icon={CalendarDays}
                  title="本周还没有计划"
                  desc="建议先把上线前必须完成的事项排进本周。"
                />
              ) : (
                weekPlans.slice(0, 4).map((plan) => (
                  <CompactPlan key={plan.id} plan={plan} />
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="surface-panel rounded-lg p-5">
        <SectionHeader
          title="项目沙箱"
          desc="把想法、任务和知识按项目承载，避免信息散落"
          actionLabel="进入项目"
          href="/projects"
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {projectCards.map((project) => {
            const Icon = project.icon
            return (
              <Link
                key={project.title}
                href={project.href}
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-[hsl(var(--accent))]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                    {project.metric}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[hsl(var(--accent))]" />
                  </div>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{project.desc}</p>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>{project.status}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: IconComponent
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-normal text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function SectionHeader({
  title,
  desc,
  actionLabel,
  href,
}: {
  title: string
  desc: string
  actionLabel?: string
  href?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      {href && actionLabel && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

function PlanRow({ plan }: { plan: PlanLike }) {
  const type = getTypeMeta(plan.type)
  const priority = getPriorityMeta(plan.priority)
  const progress = normalizeProgress(plan.progress)

  return (
    <Link
      href={`/plans/${plan.id}`}
      className="group grid gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary/40 lg:grid-cols-[minmax(0,1fr)_170px]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium", type.className)}>
            {type.label}
          </span>
          <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium", priority.className)}>
            {priority.label}
          </span>
          {plan.status && (
            <span className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              {plan.status}
            </span>
          )}
        </div>
        <h3 className="mt-3 truncate text-sm font-semibold text-foreground">{plan.title}</h3>
        {plan.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
        )}
      </div>
      <div className="flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{plan.due_date ? formatDueDate(plan.due_date) : "未设截止"}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-[hsl(var(--accent))]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

function CompactPlan({ plan }: { plan: PlanLike }) {
  const priority = getPriorityMeta(plan.priority)
  const progress = normalizeProgress(plan.progress)

  return (
    <Link
      href={`/plans/${plan.id}`}
      className="block rounded-md border border-border bg-card p-3 transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:bg-secondary/50"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">{plan.title}</p>
        <span className={cn("shrink-0 rounded-md px-2 py-1 text-[11px] font-medium", priority.className)}>
          {priority.shortLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-secondary">
          <div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${progress}%` }} />
        </div>
        <span className="w-9 text-right text-xs text-muted-foreground">{progress}%</span>
      </div>
    </Link>
  )
}

function ReminderItem({ reminder }: { reminder: ReminderLike }) {
  const meta = getReminderMeta(reminder.reminder_type)
  const Icon = meta.icon

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md", meta.className)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{reminder.title}</p>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              {meta.label}
            </span>
          </div>
          {reminder.description && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{reminder.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardEmpty({
  icon: Icon,
  title,
  desc,
}: {
  icon: IconComponent
  title: string
  desc: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
      <Icon className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function mergePlans(todayPlans: PlanLike[], weekPlans: PlanLike[]) {
  const map = new Map<string, PlanLike>()
  for (const plan of todayPlans) {
    map.set(plan.id, plan)
  }
  for (const plan of weekPlans) {
    if (!map.has(plan.id)) {
      map.set(plan.id, plan)
    }
  }
  return Array.from(map.values())
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
  if (type === "bug") {
    return {
      label: "Bug",
      className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    }
  }

  if (type === "requirement") {
    return {
      label: "需求",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    }
  }

  return {
    label: "计划",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  }
}

function getPriorityMeta(priority: PlanLike["priority"]) {
  if (priority === "high") {
    return {
      label: "高优先级",
      shortLabel: "高",
      className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    }
  }

  if (priority === "medium") {
    return {
      label: "中优先级",
      shortLabel: "中",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    }
  }

  return {
    label: "低优先级",
    shortLabel: "低",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  }
}

function getReminderMeta(type: ReminderLike["reminder_type"]) {
  if (type === "bug_severe") {
    return {
      label: "严重 Bug",
      icon: Bug,
      className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    }
  }

  if (type === "plan_overdue") {
    return {
      label: "计划逾期",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    }
  }

  if (type === "weekly_candidate") {
    return {
      label: "周报候选",
      icon: FileText,
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    }
  }

  return {
    label: "自定义提醒",
    icon: MessageSquareText,
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  }
}

function formatDueDate(value: string) {
  if (value === "今天" || value.startsWith("周")) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  })
}

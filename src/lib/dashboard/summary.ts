import { getDateKey, getDaysUntilDue, isActivePlan } from "@/lib/data/reminder-rules"
import { toVisibleStatus } from "@/lib/work-plans/status-rules"

export type DashboardPlanLike = {
  id: string
  title: string
  type?: string | null
  priority?: string | null
  status?: string | null
  progress?: number | null
  due_date?: string | null
  description?: string | null
  bug_severity?: string | null
  deleted_at?: string | null
}

export type DashboardReminderLike = {
  id: string
  reminder_type: "bug_severe" | "plan_overdue" | "plan_due_soon" | "important_plan" | "weekly_candidate" | "custom"
  title: string
  description: string
  source_id: string
}

export type DashboardSummary = {
  todayPlans: DashboardPlanLike[]
  weekPlans: DashboardPlanLike[]
  inProgressPlans: DashboardPlanLike[]
  todayReminders: DashboardReminderLike[]
  weekReminders: DashboardReminderLike[]
  metrics: Record<DashboardViewMode, DashboardViewMetrics>
  importantCount: number
  unfinishedCount: number
  averageProgress: number
}

export type DashboardViewMode = "today" | "week" | "inProgress"

export type DashboardViewMetrics = {
  planCount: number
  importantCount: number
  unfinishedCount: number
  averageProgress: number
}

export function buildDashboardSummary(plans: DashboardPlanLike[], now = new Date()): DashboardSummary {
  const todayKey = getDateKey(now)
  const weekStartKey = getDateKey(getWeekStart(now))
  const weekEndKey = getDateKey(addDaysToDate(getWeekStart(now), 6))
  const visiblePlans = plans.filter((plan) => !plan.deleted_at)

  const todayPlans = visiblePlans
    .filter((plan) => isDueOnOrBefore(plan.due_date, todayKey))
    .sort(compareQueuePlans)

  const weekPlans = visiblePlans
    .filter((plan) => isDueForWeek(plan.due_date, weekStartKey, weekEndKey, todayKey))
    .sort(compareQueuePlans)
  const activePlans = visiblePlans.filter((plan) => !isFinishedPlan(plan))
  const inProgressPlans = [...activePlans].sort(compareInProgressPlans)

  const todayReminders = todayPlans
    .filter((plan) => !isFinishedPlan(plan))
    .map((plan) => buildPlanReminder(plan, todayKey, true))
  const weekReminders = weekPlans
    .filter((plan) => !isFinishedPlan(plan))
    .map((plan) => buildPlanReminder(plan, todayKey, false))
  const metrics = {
    today: buildViewMetrics(todayPlans),
    week: buildViewMetrics(weekPlans),
    inProgress: buildViewMetrics(inProgressPlans, true),
  }

  return {
    todayPlans,
    weekPlans,
    inProgressPlans,
    todayReminders,
    weekReminders,
    metrics,
    importantCount: metrics.week.importantCount,
    unfinishedCount: metrics.week.unfinishedCount,
    averageProgress: metrics.week.averageProgress,
  }
}

export function normalizeProgress(progress?: number | null): number {
  if (typeof progress !== "number" || Number.isNaN(progress)) return 0
  if (progress < 0) return 0
  if (progress > 100) return 100
  return Math.round(progress)
}

export function isFinishedPlan(plan: Pick<DashboardPlanLike, "status" | "progress">): boolean {
  if (!isActivePlan(plan.status)) return true
  return false
}

function buildPlanReminder(plan: DashboardPlanLike, todayKey: string, isTodayQueue: boolean): DashboardReminderLike {
  const daysUntilDue = getDaysUntilDue(getDueDateKey(plan.due_date), todayKey)
  if (daysUntilDue !== null && daysUntilDue < 0) {
    return {
      id: `overdue-${plan.id}`,
      reminder_type: "plan_overdue",
      title: `逾期计划：${plan.title}`,
      description: `已逾期 ${Math.abs(daysUntilDue)} 天，请先确认是否需要调整计划。`,
      source_id: plan.id,
    }
  }

  if (plan.type === "bug" && plan.bug_severity === "high") {
    return {
      id: `bug-${plan.id}`,
      reminder_type: "bug_severe",
      title: `严重 Bug 待处理：${plan.title}`,
      description: "高等级 Bug 容易影响上线或使用入口，建议优先闭环。",
      source_id: plan.id,
    }
  }

  if (isImportantPlan(plan)) {
    return {
      id: `important-${plan.id}`,
      reminder_type: "important_plan",
      title: isTodayQueue ? `今天必须关注：${plan.title}` : `本周重要计划：${plan.title}`,
      description: isTodayQueue ? "这是今天截止的重要计划，请优先确认推进状态。" : "这是本周的重要计划，请提前确认阻塞和剩余动作。",
      source_id: plan.id,
    }
  }

  if (isTodayQueue) {
    return {
      id: `due-${plan.id}`,
      reminder_type: "plan_due_soon",
      title: `今天到期：${plan.title}`,
      description: "今天截止的事项需要在今日队列里优先露出。",
      source_id: plan.id,
    }
  }

  return {
    id: `week-${plan.id}`,
    reminder_type: "weekly_candidate",
    title: `本周计划：${plan.title}`,
    description: "本周截止的事项适合纳入周计划节奏检查。",
    source_id: plan.id,
  }
}

function getCompletionProgress(plans: DashboardPlanLike[]): number {
  if (plans.length === 0) return 0

  let completedCount = 0
  for (const plan of plans) {
    if (isCompletedPlan(plan)) completedCount += 1
  }
  return Math.round((completedCount / plans.length) * 100)
}

function buildViewMetrics(plans: DashboardPlanLike[], forceZeroProgress = false): DashboardViewMetrics {
  return {
    planCount: plans.length,
    importantCount: plans.filter((plan) => isImportantPlan(plan)).length,
    unfinishedCount: plans.filter((plan) => !isFinishedPlan(plan)).length,
    averageProgress: forceZeroProgress ? 0 : getCompletionProgress(plans),
  }
}

function getWeekStart(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + mondayOffset)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function isDueOnOrBefore(dueDate: string | null | undefined, todayKey: string): boolean {
  const dueDateKey = getDueDateKey(dueDate)
  if (!dueDateKey) return false
  return dueDateKey <= todayKey
}

function isDueForWeek(dueDate: string | null | undefined, startKey: string, endKey: string, todayKey: string): boolean {
  const dueDateKey = getDueDateKey(dueDate)
  if (!dueDateKey) return false
  if (dueDateKey < todayKey) return true
  return dueDateKey >= startKey && dueDateKey <= endKey
}

function isImportantPlan(plan: Pick<DashboardPlanLike, "priority">): boolean {
  return plan.priority === "high"
}

function isCompletedPlan(plan: Pick<DashboardPlanLike, "status">): boolean {
  return toVisibleStatus(plan.status) === "已完成"
}

function compareQueuePlans(left: DashboardPlanLike, right: DashboardPlanLike): number {
  const statusDiff = getVisibleStatusRank(left) - getVisibleStatusRank(right)
  if (statusDiff !== 0) return statusDiff

  return compareByDueDate(left, right)
}

function compareInProgressPlans(left: DashboardPlanLike, right: DashboardPlanLike): number {
  return compareByDueDate(left, right)
}

function compareByDueDate(left: DashboardPlanLike, right: DashboardPlanLike): number {
  const leftDue = getDueDateKey(left.due_date) || "9999-12-31"
  const rightDue = getDueDateKey(right.due_date) || "9999-12-31"
  if (leftDue !== rightDue) return leftDue.localeCompare(rightDue)

  return left.title.localeCompare(right.title, "zh-CN")
}

function getVisibleStatusRank(plan: Pick<DashboardPlanLike, "status">): number {
  const status = toVisibleStatus(plan.status)
  if (status === "进行中") return 0
  if (status === "已完成") return 1
  return 2
}

function getDueDateKey(dueDate: string | null | undefined): string {
  return (dueDate || "").slice(0, 10)
}

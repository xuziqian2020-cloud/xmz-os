export type ReminderPlanLike = {
  priority?: string | null
  status?: string | null
  due_date?: string | null
}

const doneStatuses = new Set(["已完成", "已上线", "已归档", "已取消", "已修复"])

export function isActivePlan(status?: string | null): boolean {
  return !doneStatuses.has(status || "")
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return getDateKey(date)
}

export function getDaysUntilDue(dueDate: string | null | undefined, todayKey: string): number | null {
  if (!dueDate) return null
  const due = parseDateKey(dueDate)
  const today = parseDateKey(todayKey)
  if (Number.isNaN(due.getTime())) return null
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

export function shouldCreateImportantPlanReminder(plan: ReminderPlanLike, todayKey: string): boolean {
  const daysUntilDue = getDaysUntilDue(plan.due_date, todayKey)
  return plan.priority === "high" && isActivePlan(plan.status) && (daysUntilDue === 0 || daysUntilDue === 1)
}

export function shouldCreateDueSoonReminder(plan: ReminderPlanLike, todayKey: string): boolean {
  const daysUntilDue = getDaysUntilDue(plan.due_date, todayKey)
  return isActivePlan(plan.status) && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

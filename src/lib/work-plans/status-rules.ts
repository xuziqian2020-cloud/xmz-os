import type { WorkPlanPriority, WorkPlanType } from "@/lib/database.types"

export const visiblePlanStatuses = ["进行中", "已完成", "已拒绝"] as const
export const planPriorityValues = ["high", "medium", "low"] as const

export type VisiblePlanStatus = (typeof visiblePlanStatuses)[number]
export type PlanPriorityValue = (typeof planPriorityValues)[number]

export type StatusRuleInput = {
  type?: WorkPlanType | string | null
  status?: string | null
  progress?: number | null
}

export function getDefaultStatus(_type?: WorkPlanType | string | null): VisiblePlanStatus {
  return "进行中"
}

export function getAllowedStatuses(_type?: WorkPlanType | string | null): readonly VisiblePlanStatus[] {
  return visiblePlanStatuses
}

export function normalizeStatusForType(input: StatusRuleInput): { status: VisiblePlanStatus; progress: number } {
  const status = toVisibleStatus(input.status)

  if (status === "已完成") {
    return { status, progress: 100 }
  }

  if (status === "已拒绝") {
    return { status, progress: 0 }
  }

  return {
    status,
    progress: clampProgress(input.progress),
  }
}

export function statusToPriority(status?: string | null): WorkPlanPriority {
  if (status === "重要" || status === "high") return "high"
  if (status === "低" || status === "low") return "low"
  return "medium"
}

export function priorityToStatus(_priority?: string | null): VisiblePlanStatus {
  return "进行中"
}

export function priorityToLabel(priority?: string | null): string {
  if (priority === "high") return "重要"
  if (priority === "low") return "低"
  return "中等"
}

export function normalizePriority(priority?: string | null): PlanPriorityValue {
  if (priority === "high" || priority === "medium" || priority === "low") return priority
  if (priority === "重要") return "high"
  if (priority === "低") return "low"
  return "medium"
}

export function toVisibleStatus(status?: string | null): VisiblePlanStatus {
  if (status === "已完成" || status === "已上线" || status === "已归档" || status === "已修复") return "已完成"
  if (status === "已拒绝" || status === "已取消" || status === "无法重现") return "已拒绝"
  return "进行中"
}

export function clampProgress(progress?: number | null): number {
  if (typeof progress !== "number" || Number.isNaN(progress)) return 0
  if (progress < 0) return 0
  if (progress > 100) return 100
  return Math.round(progress)
}

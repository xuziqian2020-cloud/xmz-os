import type { WorkPlanPriority, WorkPlanType } from "@/lib/database.types"

export const visiblePlanStatuses = ["重要", "中等", "低"] as const

export type VisiblePlanStatus = (typeof visiblePlanStatuses)[number]

export type StatusRuleInput = {
  type?: WorkPlanType | string | null
  status?: string | null
  progress?: number | null
}

export function getDefaultStatus(_type?: WorkPlanType | string | null): VisiblePlanStatus {
  return "中等"
}

export function getAllowedStatuses(_type?: WorkPlanType | string | null): readonly VisiblePlanStatus[] {
  return visiblePlanStatuses
}

export function normalizeStatusForType(input: StatusRuleInput): { status: VisiblePlanStatus; progress: number } {
  const status = toVisibleStatus(input.status)

  return {
    status,
    progress: clampProgress(input.progress),
  }
}

export function statusToPriority(status?: string | null): WorkPlanPriority {
  if (status === "重要") return "high"
  if (status === "低") return "low"
  return "medium"
}

export function priorityToStatus(priority?: string | null): VisiblePlanStatus {
  if (priority === "high") return "重要"
  if (priority === "low") return "低"
  return "中等"
}

export function toVisibleStatus(status?: string | null): VisiblePlanStatus {
  if (status === "重要" || status === "中等" || status === "低") return status
  if (status === "high") return "重要"
  if (status === "medium") return "中等"
  if (status === "low") return "低"
  return "中等"
}

export function clampProgress(progress?: number | null): number {
  if (typeof progress !== "number" || Number.isNaN(progress)) return 0
  if (progress < 0) return 0
  if (progress > 100) return 100
  return Math.round(progress)
}

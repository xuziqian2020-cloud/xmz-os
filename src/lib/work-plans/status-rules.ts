import type { WorkPlanType } from "@/lib/database.types"

export const requirementStatuses = ["待确认", "待开发", "开发中", "待测试", "已完成", "已上线", "已取消"] as const
export const bugStatuses = ["待分析", "无法重现", "已修复"] as const
export const customWorkStatuses = ["未开始", "进行中", "已完成", "已暂停", "已取消"] as const

export type StatusRuleInput = {
  type?: WorkPlanType | string | null
  status?: string | null
  progress?: number | null
}

export function getDefaultStatus(type?: WorkPlanType | string | null): string {
  if (type === "bug") return "待分析"
  if (type === "requirement") return "待确认"
  return "未开始"
}

export function getAllowedStatuses(type?: WorkPlanType | string | null): readonly string[] {
  if (type === "bug") return bugStatuses
  if (type === "requirement") return requirementStatuses
  return customWorkStatuses
}

export function normalizeStatusForType(input: StatusRuleInput): { status: string; progress: number } {
  const allowedStatuses = getAllowedStatuses(input.type)
  const defaultStatus = getDefaultStatus(input.type)
  const status = input.status && allowedStatuses.includes(input.status) ? input.status : defaultStatus

  if (input.type === "bug") {
    return {
      status,
      progress: status === "已修复" ? 100 : 0,
    }
  }

  return {
    status,
    progress: clampProgress(input.progress),
  }
}

export function clampProgress(progress?: number | null): number {
  if (typeof progress !== "number" || Number.isNaN(progress)) return 0
  if (progress < 0) return 0
  if (progress > 100) return 100
  return Math.round(progress)
}

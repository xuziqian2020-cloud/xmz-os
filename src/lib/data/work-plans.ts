// 工作计划数据层
import { createClient } from "@/lib/supabase/server"
import type { WorkPlan } from "@/lib/database.types"
import { normalizePriority, normalizeStatusForType } from "@/lib/work-plans/status-rules"

type DashboardWorkPlanSelectedQuery<TSelf> = {
  is(column: string, value: null): TSelf
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): TSelf
}

type DashboardWorkPlanBaseQuery<T> = {
  select(columns: string): T
}

export function applyDashboardWorkPlanQuery<T extends DashboardWorkPlanSelectedQuery<T>>(
  query: DashboardWorkPlanBaseQuery<T>
): T {
  return query
    .select("*")
    // 工作台必须按截止时间组织待办，避免旧创建事项被创建时间排序挤出今日/本周视图。
    .is("deleted_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
}

export async function getWorkPlans(filters?: {
  project_id?: string
  type?: string
  status?: string
  priority?: string
  limit?: number
}): Promise<WorkPlan[]> {
  const supabase = createClient()
  let query = supabase
    .from("work_plans")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (filters?.project_id) query = query.eq("project_id", filters.project_id)
  if (filters?.type) query = query.eq("type", filters.type)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.priority) query = query.eq("priority", filters.priority)
  if (filters?.limit) query = query.limit(filters.limit)

  const { data } = await query
  return (data as WorkPlan[]) ?? []
}

export async function getDashboardWorkPlans(): Promise<WorkPlan[]> {
  const supabase = createClient()
  const { data } = await applyDashboardWorkPlanQuery(supabase.from("work_plans"))
  return (data as WorkPlan[]) ?? []
}

export async function getWorkPlan(id: string): Promise<WorkPlan | null> {
  const supabase = createClient()
  const { data } = await supabase.from("work_plans").select("*").eq("id", id).single()
  return (data as WorkPlan) ?? null
}

export async function createWorkPlan(input: {
  project_id: string
  type: string
  title: string
  description?: string
  priority?: string
  status?: string
  start_date?: string
  due_date?: string
  bug_severity?: string
  bug_symptom?: string
  tags?: string[]
  source_person?: string
  requirement_background?: string
  acceptance_criteria?: string
}): Promise<WorkPlan> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("未登录")

  const statusRule = normalizeStatusForType({
    type: input.type,
    status: input.status || "进行中",
  })
  const priority = normalizePriority(input.priority)

  const { data, error } = await supabase
    .from("work_plans")
    .insert({
      ...input,
      user_id: user.id,
      status: statusRule.status,
      priority,
      bug_severity: input.type === "bug" ? normalizePriority(input.bug_severity || priority) : input.bug_severity,
      progress: statusRule.progress,
    })
    .select()
    .single()

  if (error) throw error
  return data as WorkPlan
}

export async function updateWorkPlan(id: string, input: Record<string, any>): Promise<WorkPlan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("work_plans")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as WorkPlan
}

export async function deleteWorkPlan(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("work_plans")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

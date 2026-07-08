// 工作计划数据层
import { createClient } from "@/lib/supabase/server"
import type { WorkPlan } from "@/lib/database.types"
import { normalizeStatusForType } from "@/lib/work-plans/status-rules"

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
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.project_id) query = query.eq("project_id", filters.project_id)
  if (filters?.type) query = query.eq("type", filters.type)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.priority) query = query.eq("priority", filters.priority)
  if (filters?.limit) query = query.limit(filters.limit)

  const { data } = await query
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
    status: input.status,
  })

  const { data, error } = await supabase
    .from("work_plans")
    .insert({ ...input, user_id: user.id, status: statusRule.status, progress: statusRule.progress })
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

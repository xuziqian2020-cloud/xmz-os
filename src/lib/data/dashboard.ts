// 工作台数据查询
import { createClient } from "@/lib/supabase/server"
import type { WorkPlan, SmartReminder } from "@/lib/database.types"

// 获取当前用户信息
export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 获取今日计划
export async function getTodayPlans(): Promise<WorkPlan[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("work_plans")
    .select("*")
    .eq("due_date", today)
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20)

  return (data as WorkPlan[]) ?? []
}

// 获取本周计划
export async function getWeekPlans(): Promise<WorkPlan[]> {
  const supabase = createClient()
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from("work_plans")
    .select("*")
    .gte("due_date", startOfWeek.toISOString().split("T")[0])
    .lte("due_date", endOfWeek.toISOString().split("T")[0])
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true })
    .limit(50)

  return (data as WorkPlan[]) ?? []
}

// 获取活跃提醒
export async function getActiveReminders(): Promise<SmartReminder[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from("smart_reminders")
    .select("*")
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })
    .limit(10)

  return (data as SmartReminder[]) ?? []
}

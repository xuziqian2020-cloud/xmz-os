// 小美 AI 秘书 — 提醒生成逻辑
import { createClient } from "@/lib/supabase/server"
import type { SmartReminder } from "@/lib/database.types"
import { addDays, getDateKey, getDaysUntilDue } from "@/lib/data/reminder-rules"

// 生成提醒（每次 Dashboard 加载时调用）
export async function generateReminders(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 1. 检查是否有 high severity 的未处理 Bug
  const { data: severeBugs } = await supabase
    .from("work_plans")
    .select("id, title, project_id")
    .eq("type", "bug")
    .eq("bug_severity", "high")
    .not("status", "in", '("已修复","无法重现")')
    .is("deleted_at", null)
    .limit(3)

  if (severeBugs && severeBugs.length > 0) {
    for (const bug of severeBugs) {
      await upsertReminder(supabase, user.id, {
        reminder_type: "bug_severe",
        title: `严重 Bug 待处理：${bug.title}`,
        description: "high 等级 Bug 建议优先修复",
        source_type: "work_plan",
        source_id: bug.id,
        project_id: bug.project_id,
      })
    }
  }

  // 2. 检查逾期计划
  const today = getDateKey(new Date())
  const { data: overduePlans } = await supabase
    .from("work_plans")
    .select("id, title, project_id, due_date")
    .lt("due_date", today)
    .not("status", "in", '("已完成","已上线","已归档","已取消","已修复")')
    .is("deleted_at", null)
    .limit(3)

  if (overduePlans && overduePlans.length > 0) {
    for (const plan of overduePlans) {
      const days = Math.floor((Date.now() - new Date(plan.due_date!).getTime()) / 86400000)
      await upsertReminder(supabase, user.id, {
        reminder_type: "plan_overdue",
        title: `逾期计划：${plan.title}`,
        description: `已逾期 ${days} 天，请确认是否需要调整`,
        source_type: "work_plan",
        source_id: plan.id,
        project_id: plan.project_id,
      })
    }
  }

  // 3. 当天或明天到期的高优先级计划，作为重要计划提醒。
  const tomorrow = addDays(today, 1)
  const { data: importantPlans } = await supabase
    .from("work_plans")
    .select("id, title, project_id, due_date")
    .eq("priority", "high")
    .gte("due_date", today)
    .lte("due_date", tomorrow)
    .not("status", "in", '("已完成","已上线","已归档","已取消","已修复")')
    .is("deleted_at", null)
    .limit(5)

  if (importantPlans && importantPlans.length > 0) {
    for (const plan of importantPlans) {
      const days = getDaysUntilDue(plan.due_date, today)
      await upsertReminder(supabase, user.id, {
        reminder_type: "important_plan",
        title: days === 0 ? `今天必须关注：${plan.title}` : `明天重要计划：${plan.title}`,
        description: days === 0 ? "这是今天到期的高优先级计划，请优先确认推进状态。" : "高优先级计划将在明天到期，请提前一天确认是否能按时完成。",
        source_type: "work_plan",
        source_id: plan.id,
        project_id: plan.project_id,
      })
    }
  }

  // 4. 三天内到期的未完成计划，提前预警节奏风险。
  const threeDaysLater = addDays(today, 3)
  const { data: dueSoonPlans } = await supabase
    .from("work_plans")
    .select("id, title, project_id, due_date")
    .gte("due_date", today)
    .lte("due_date", threeDaysLater)
    .not("status", "in", '("已完成","已上线","已归档","已取消","已修复")')
    .is("deleted_at", null)
    .limit(5)

  if (dueSoonPlans && dueSoonPlans.length > 0) {
    for (const plan of dueSoonPlans) {
      const days = getDaysUntilDue(plan.due_date, today)
      await upsertReminder(supabase, user.id, {
        reminder_type: "plan_due_soon",
        title: days === 0 ? `今天到期：${plan.title}` : `${days} 天后到期：${plan.title}`,
        description: "该计划将在 3 天内到期，请提前确认负责人、阻塞项和剩余动作。",
        source_type: "work_plan",
        source_id: plan.id,
        project_id: plan.project_id,
      })
    }
  }
}

async function upsertReminder(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  input: Omit<SmartReminder, "id" | "user_id" | "is_dismissed" | "dismissed_at" | "created_at">
) {
  // 检查是否已存在相同提醒
  const { data: existing } = await supabase
    .from("smart_reminders")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", input.source_type)
    .eq("source_id", input.source_id)
    .eq("reminder_type", input.reminder_type)
    .eq("is_dismissed", false)
    .maybeSingle()

  if (!existing) {
    await supabase.from("smart_reminders").insert({ ...input, user_id: userId })
  }
}

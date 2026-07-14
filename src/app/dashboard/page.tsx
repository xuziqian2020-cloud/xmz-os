import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { getDashboardWorkPlans } from "@/lib/data/work-plans"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let plans: any[] = []
  let error = ""

  try {
    plans = await getDashboardWorkPlans()
  } catch (e: any) {
    error = e.message || "工作计划加载失败"
  }

  return <DashboardClient initialPlans={plans} initialError={error} />
}

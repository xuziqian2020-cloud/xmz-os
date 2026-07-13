import { ReportsClient } from "@/components/reports/reports-client"
import { getReportsInput } from "@/lib/data/reports"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const data = await getReportsInput()
  return <ReportsClient initialData={data} />
}

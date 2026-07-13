import { createClient } from "@/lib/supabase/server"
import { getKnowledgeDocuments } from "@/lib/data/knowledge"
import { getProjects } from "@/lib/data/projects"
import { getWorkPlans } from "@/lib/data/work-plans"
import type { ReportInput, ReportItem } from "@/lib/reports/generate-report"

export async function getReportsInput(): Promise<ReportInput> {
  const [projects, plans, knowledge, prompts, ideas] = await Promise.all([
    getProjects(),
    getWorkPlans({ limit: 500 }),
    getKnowledgeDocuments(),
    getPromptTemplates(),
    getIdeas(),
  ])

  return {
    projects: projects as unknown as ReportItem[],
    plans: plans as unknown as ReportItem[],
    knowledge: knowledge as unknown as ReportItem[],
    prompts,
    ideas,
  }
}

async function getPromptTemplates(): Promise<ReportItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("prompt_templates")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500)

  return (data as unknown as ReportItem[]) ?? []
}

async function getIdeas(): Promise<ReportItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500)

  return (data as unknown as ReportItem[]) ?? []
}

// 项目数据层 — CRUD 操作
import { createClient } from "@/lib/supabase/server"
import type { Project, Database } from "@/lib/database.types"

// 获取所有项目（按更新日期倒序）
export async function getProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  return ((data as Project[]) ?? []).map(normalizeProject)
}

// 获取单个项目
export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single()
  return data ? normalizeProject(data as Project) : null
}

// 创建项目
export async function createProject(input: {
  name: string
  code?: string
  description?: string
  tech_stack?: string[]
  project_type?: string
  git_url?: string
  local_path?: string
}): Promise<Project> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("未登录")

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, user_id: user.id, status: "active" })
    .select()
    .single()

  if (error) throw error
  return data as Project
}

// 更新项目
export async function updateProject(
  id: string,
  input: Partial<{
    name: string
    code: string
    description: string
    tech_stack: string[]
    project_type: string
    status: string
    git_url: string
    local_path: string
  }>
): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("projects")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

// 软删除项目
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
}

// 获取项目的统计信息
export async function getProjectStats(projectId: string) {
  const supabase = createClient()

  const [
    { count: planCount },
    { count: knowledgeCount },
    { count: bugCount },
    { count: fileCount },
    { count: ideaCount },
    { count: promptCount },
    { count: processCount },
  ] = await Promise.all([
    supabase.from("work_plans").select("*", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
    supabase.from("knowledge_documents").select("*", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
    supabase.from("work_plans").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("type", "bug").is("deleted_at", null),
    supabase.from("files").select("*", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
    supabase.from("ideas").select("*", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
    supabase.from("prompt_templates").select("*", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
    supabase.from("process_diagrams").select("*", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
  ])

  return {
    planCount: planCount ?? 0,
    knowledgeCount: knowledgeCount ?? 0,
    bugCount: bugCount ?? 0,
    fileCount: fileCount ?? 0,
    ideaCount: ideaCount ?? 0,
    promptCount: promptCount ?? 0,
    processCount: processCount ?? 0,
  }
}

export function normalizeProjectTechStack(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean)
  return []
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    tech_stack: normalizeProjectTechStack((project as any).tech_stack),
  }
}

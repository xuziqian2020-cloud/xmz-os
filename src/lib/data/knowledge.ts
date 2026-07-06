// 知识库数据层
import { createClient } from "@/lib/supabase/server"
import type { KnowledgeDocument } from "@/lib/database.types"

export async function getKnowledgeDocuments(filters?: {
  project_id?: string; category?: string; search?: string
}): Promise<KnowledgeDocument[]> {
  const supabase = createClient()
  let query = supabase.from("knowledge_documents").select("*").is("deleted_at", null).order("updated_at", { ascending: false })
  if (filters?.project_id) query = query.eq("project_id", filters.project_id)
  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  const { data } = await query
  return (data as KnowledgeDocument[]) ?? []
}

export async function getKnowledgeDocument(id: string): Promise<KnowledgeDocument | null> {
  const supabase = createClient()
  const { data } = await supabase.from("knowledge_documents").select("*").eq("id", id).single()
  return (data as KnowledgeDocument) ?? null
}

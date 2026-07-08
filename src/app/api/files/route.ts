import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const url = new URL(request.url)
  const projectId = url.searchParams.get("project_id")
  let query = supabase.from("files").select("*").is("deleted_at", null).order("created_at", { ascending: false })
  if (projectId) query = query.eq("project_id", projectId)
  const { data } = await query
  return NextResponse.json(data ?? [])
}

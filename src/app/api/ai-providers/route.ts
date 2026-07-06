import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from("ai_providers").select("*").is("deleted_at", null).order("created_at", { ascending: true })
  return NextResponse.json(data ?? [])
}

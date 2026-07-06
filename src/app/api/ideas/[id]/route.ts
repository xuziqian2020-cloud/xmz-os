import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase.from("ideas").select("*").eq("id", params.id).single()
  return NextResponse.json(data)
}
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body = await request.json()
  const { data, error } = await supabase.from("ideas").update({ ...body, updated_at: new Date().toISOString() }).eq("id", params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

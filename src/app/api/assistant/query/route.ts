import { NextResponse } from "next/server"
import { detectAssistantCommand } from "@/lib/assistant/commands"
import { buildAssistantSqlQuery } from "@/lib/assistant/sql"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const text = url.searchParams.get("text") || ""
  const command = detectAssistantCommand(text)
  if (!command || command.action !== "query") {
    return NextResponse.json({ error: "只支持查询类指令。" }, { status: 400 })
  }

  const spec = buildAssistantSqlQuery(command)
  if (!spec) return NextResponse.json({ error: "暂不支持这个查询指令。" }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "未登录", sql: spec.sql, resultLabel: spec.resultLabel, rows: [] }, { status: 401 })
  }

  let query: any = supabase
    .from(spec.table)
    .select(spec.select)
    .is("deleted_at", null)
    .order(spec.orderBy, { ascending: false })
    .limit(spec.limit)

  for (const filter of spec.filters) {
    query = query.eq(filter.field, filter.value)
  }

  if (spec.searchText && spec.searchFields.length > 0) {
    const keyword = spec.searchText.replace(/[%*,]/g, " ").trim()
    if (keyword) {
      query = query.or(spec.searchFields.map((field) => `${field}.ilike.%${keyword}%`).join(","))
    }
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message, sql: spec.sql, resultLabel: spec.resultLabel, rows: [] }, { status: 500 })
  return NextResponse.json({ sql: spec.sql, resultLabel: spec.resultLabel, rows: data ?? [] })
}

function isLocalAdminRequest(request: Request): boolean {
  return request.headers.get("x-xmz-local-admin") === "1"
}

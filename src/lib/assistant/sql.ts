import type { DetectedAssistantCommand } from "./commands"

export type AssistantSqlFilter = {
  field: string
  value: string
}

export type AssistantSqlQuery = {
  resultLabel: string
  table: string
  select: string
  filters: AssistantSqlFilter[]
  searchFields: string[]
  searchText: string
  orderBy: string
  limit: number
  sql: string
}

export function buildAssistantSqlQuery(command: DetectedAssistantCommand): AssistantSqlQuery | null {
  if (command.action !== "query") return null

  if (command.entity === "bug") {
    return buildQuery({
      resultLabel: "Bug",
      table: "work_plans",
      select: "id,title,status,priority,due_date,created_at",
      filters: [{ field: "type", value: "bug" }],
      searchFields: ["title", "description", "bug_symptom"],
      searchText: command.bodyText,
    })
  }

  if (command.entity === "knowledge") {
    return buildQuery({
      resultLabel: "知识库",
      table: "knowledge_documents",
      select: "id,title,category,source,updated_at,created_at",
      filters: [{ field: "category", value: "技术文档" }],
      searchFields: ["title", "content", "source"],
      searchText: command.bodyText,
      orderBy: "updated_at",
    })
  }

  if (command.entity === "experience") {
    return buildQuery({
      resultLabel: "经验库",
      table: "knowledge_documents",
      select: "id,title,category,source,updated_at,created_at",
      filters: [{ field: "category", value: "经验库" }],
      searchFields: ["title", "content", "source"],
      searchText: command.bodyText,
      orderBy: "updated_at",
    })
  }

  if (command.entity === "prompt") {
    return buildQuery({
      resultLabel: "Prompt",
      table: "prompt_templates",
      select: "id,title,scene,model_scope,updated_at,created_at",
      filters: [],
      searchFields: ["title", "content", "scene"],
      searchText: command.bodyText,
      orderBy: "updated_at",
    })
  }

  if (command.entity === "file") {
    return buildQuery({
      resultLabel: "文件",
      table: "files",
      select: "id,file_name,file_type,file_size,created_at",
      filters: [],
      searchFields: ["file_name", "file_type", "remark"],
      searchText: command.bodyText,
    })
  }

  if (command.entity === "idea") {
    return buildQuery({
      resultLabel: "灵感",
      table: "ideas",
      select: "id,title,category,status,created_at",
      filters: [],
      searchFields: ["title", "content", "category"],
      searchText: command.bodyText,
    })
  }

  return null
}

export function formatAssistantSqlQueryResult(sql: string, label: string, rows: any[]): string {
  const list = Array.isArray(rows) ? rows : []
  const summary = list.length === 0
    ? `没有查到${label}数据。`
    : `查到 ${list.length} 条${label}，先给你前 ${Math.min(5, list.length)} 条：\n${list.slice(0, 5).map((item, index) => {
        const title = item.title || item.file_name || item.name || "未命名"
        const extra = item.status ? `（${item.status}）` : item.category ? `（${item.category}）` : ""
        return `${index + 1}. ${title}${extra}`
      }).join("\n")}`

  return `我先形成了这条 SQL：\n\`\`\`sql\n${sql}\n\`\`\`\n\n${summary}`
}

function buildQuery({
  resultLabel,
  table,
  select,
  filters,
  searchFields,
  searchText,
  orderBy = "created_at",
  limit = 10,
}: {
  resultLabel: string
  table: string
  select: string
  filters: AssistantSqlFilter[]
  searchFields: string[]
  searchText: string
  orderBy?: string
  limit?: number
}): AssistantSqlQuery {
  const whereParts = ["deleted_at is null", ...filters.map((filter) => `${filter.field} = '${escapeSqlLiteral(filter.value)}'`)]
  const cleanedSearch = searchText.trim()
  if (cleanedSearch) {
    whereParts.push(`(${searchFields.map((field) => `${field} ilike '%${escapeSqlLiteral(cleanedSearch)}%'`).join(" or ")})`)
  }

  return {
    resultLabel,
    table,
    select,
    filters,
    searchFields,
    searchText: cleanedSearch,
    orderBy,
    limit,
    sql: `select ${select} from ${table} where ${whereParts.join(" and ")} order by ${orderBy} desc limit ${limit};`,
  }
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

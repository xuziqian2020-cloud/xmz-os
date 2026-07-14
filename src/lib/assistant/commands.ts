export type AssistantCommandAction = "create" | "query"
export type AssistantCommandEntity =
  | "bug"
  | "custom-plan"
  | "requirement"
  | "file"
  | "knowledge"
  | "experience"
  | "prompt"
  | "idea"

export type AssistantCommand = {
  label: string
  prompt: string
  action: AssistantCommandAction
  entity: AssistantCommandEntity
}

export type DetectedAssistantCommand = AssistantCommand & {
  bodyText: string
}

export type AssistantRequestSpec = {
  endpoint: string
  body: Record<string, unknown>
}

export type AssistantQuerySpec = {
  endpoint: string
  resultLabel: string
}

export const ASSISTANT_COMMANDS: AssistantCommand[] = [
  { label: "新增Bug", prompt: "新增Bug", action: "create", entity: "bug" },
  { label: "新增自定义计划", prompt: "新增自定义计划", action: "create", entity: "custom-plan" },
  { label: "新增需求", prompt: "新增需求", action: "create", entity: "requirement" },
  { label: "新增文件", prompt: "新增文件", action: "create", entity: "file" },
  { label: "新增知识库", prompt: "新增知识库", action: "create", entity: "knowledge" },
  { label: "新增经验库", prompt: "新增经验库", action: "create", entity: "experience" },
  { label: "新增Prompt", prompt: "新增Prompt", action: "create", entity: "prompt" },
  { label: "新增灵感", prompt: "新增灵感", action: "create", entity: "idea" },
  { label: "查询Bug", prompt: "查询Bug", action: "query", entity: "bug" },
  { label: "查询知识库", prompt: "查询知识库", action: "query", entity: "knowledge" },
  { label: "查询经验库", prompt: "查询经验库", action: "query", entity: "experience" },
  { label: "查询Prompt", prompt: "查询Prompt", action: "query", entity: "prompt" },
  { label: "查询文件", prompt: "查询文件", action: "query", entity: "file" },
  { label: "查询灵感", prompt: "查询灵感", action: "query", entity: "idea" },
]

const commandAliases: Record<AssistantCommandEntity, string[]> = {
  bug: ["bug", "Bug", "BUG", "缺陷", "问题"],
  "custom-plan": ["自定义计划", "计划", "任务"],
  requirement: ["需求"],
  file: ["文件", "附件"],
  knowledge: ["知识库", "知识", "文档"],
  experience: ["经验库", "经验"],
  prompt: ["Prompt", "prompt", "提示词"],
  idea: ["灵感", "想法"],
}

export function detectAssistantCommand(input: string): DetectedAssistantCommand | null {
  const text = input.trim()
  if (!text) return null

  for (const command of ASSISTANT_COMMANDS) {
    const verbs = command.action === "create" ? ["新增", "创建", "新建", "添加"] : ["查询", "查找", "搜索", "查看"]
    const aliases = commandAliases[command.entity]
    for (const verb of verbs) {
      for (const alias of aliases) {
        const pattern = new RegExp(`^${escapeRegExp(verb)}\\s*(一个|一条|1个|1条)?\\s*${escapeRegExp(alias)}\\s*[:：,，-]?\\s*`, "i")
        const match = text.match(pattern)
        if (match) {
          return {
            ...command,
            bodyText: text.slice(match[0].length).trim(),
          }
        }
      }
    }
  }

  return null
}

export function buildAssistantCreateRequest(command: DetectedAssistantCommand): AssistantRequestSpec | null {
  const title = cleanTitle(command.bodyText)
  if (!title && command.entity !== "file") return null

  if (command.entity === "bug") {
    return {
      endpoint: "/api/work-plans",
      body: {
        type: "bug",
        title,
        description: "",
        priority: "high",
        status: "进行中",
        progress: 0,
        bug_severity: "high",
      },
    }
  }

  if (command.entity === "requirement" || command.entity === "custom-plan") {
    return {
      endpoint: "/api/work-plans",
      body: {
        type: command.entity === "requirement" ? "requirement" : "custom",
        title,
        description: "",
        priority: "medium",
        status: "进行中",
        progress: 0,
      },
    }
  }

  if (command.entity === "knowledge" || command.entity === "experience") {
    return {
      endpoint: "/api/knowledge",
      body: {
        title,
        content: "",
        category: command.entity === "experience" ? "经验库" : "技术文档",
      },
    }
  }

  if (command.entity === "prompt") {
    return {
      endpoint: "/api/prompts",
      body: {
        title,
        content: command.bodyText || title,
        scene: "小美快捷新增",
      },
    }
  }

  if (command.entity === "idea") {
    return {
      endpoint: "/api/ideas",
      body: {
        title,
        content: "",
        category: "功能想法",
        status: "未整理",
      },
    }
  }

  return null
}

export function buildAssistantQueryRequest(command: DetectedAssistantCommand): AssistantQuerySpec | null {
  if (command.entity === "bug") return { endpoint: "/api/work-plans?type=bug&limit=10", resultLabel: "Bug" }
  if (command.entity === "knowledge") return { endpoint: "/api/knowledge?category=%E6%8A%80%E6%9C%AF%E6%96%87%E6%A1%A3", resultLabel: "知识库" }
  if (command.entity === "experience") return { endpoint: "/api/knowledge?category=%E7%BB%8F%E9%AA%8C%E5%BA%93", resultLabel: "经验库" }
  if (command.entity === "prompt") return { endpoint: "/api/prompts", resultLabel: "Prompt" }
  if (command.entity === "file") return { endpoint: "/api/files", resultLabel: "文件" }
  if (command.entity === "idea") return { endpoint: "/api/ideas", resultLabel: "灵感" }
  return null
}

export function formatAssistantQueryResult(label: string, rows: any[]): string {
  if (!Array.isArray(rows) || rows.length === 0) return `没有查到${label}数据。`
  const lines = rows.slice(0, 5).map((item, index) => {
    const title = item.title || item.file_name || item.name || "未命名"
    const extra = item.status ? `（${item.status}）` : item.category ? `（${item.category}）` : ""
    return `${index + 1}. ${title}${extra}`
  })
  return `查到 ${rows.length} 条${label}，先给你前 ${lines.length} 条：\n${lines.join("\n")}`
}

export function getMissingCreateInfoMessage(command: DetectedAssistantCommand): string {
  if (command.entity === "file") return "可以，把文件拖进来或点附件按钮选择文件后，再发“新增文件”。"
  const name = command.label.replace("新增", "")
  return `可以新增${name}，请在指令后面补标题，例如：${command.label}：登录页报错。`
}

function cleanTitle(text: string): string {
  return text.replace(/^标题\s*[:：]/, "").trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

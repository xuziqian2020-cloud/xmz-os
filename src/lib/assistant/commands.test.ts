import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import {
  ASSISTANT_COMMANDS,
  buildAssistantCreateRequest,
  buildAssistantQueryRequest,
  detectAssistantCommand,
} from "./commands"
import { buildAssistantSqlQuery } from "./sql"

describe("assistant commands", () => {
  it("exposes the requested create and query shortcuts", () => {
    assert.deepEqual(ASSISTANT_COMMANDS.map((command) => command.label), [
      "新增Bug",
      "新增自定义计划",
      "新增需求",
      "新增文件",
      "新增知识库",
      "新增经验库",
      "新增Prompt",
      "新增灵感",
      "查询Bug",
      "查询知识库",
      "查询经验库",
      "查询Prompt",
      "查询文件",
      "查询灵感",
    ])
  })

  it("detects create commands and builds safe API requests", () => {
    const bug = detectAssistantCommand("新增bug EOS登录失败")
    assert.equal(bug?.action, "create")
    assert.equal(bug?.entity, "bug")
    assert.equal(bug?.bodyText, "EOS登录失败")

    assert.deepEqual(buildAssistantCreateRequest(bug!), {
      endpoint: "/api/work-plans",
      body: {
        type: "bug",
        title: "EOS登录失败",
        description: "",
        priority: "high",
        status: "进行中",
        progress: 0,
        bug_severity: "high",
      },
    })

    const experience = detectAssistantCommand("新增经验库：上线复盘")
    assert.deepEqual(buildAssistantCreateRequest(experience!), {
      endpoint: "/api/knowledge",
      body: {
        title: "上线复盘",
        content: "",
        category: "经验库",
      },
    })
  })

  it("extracts structured fields from natural language create bug commands", () => {
    const command = detectAssistantCommand("新增一个bug 登录接口500 重要程度：重要 进度：已完成 截止时间:2026年8月1号")
    assert.equal(command?.action, "create")
    assert.equal(command?.entity, "bug")

    assert.deepEqual(buildAssistantCreateRequest(command!), {
      endpoint: "/api/work-plans",
      body: {
        type: "bug",
        title: "登录接口500",
        description: "",
        priority: "high",
        status: "已完成",
        progress: 100,
        due_date: "2026-08-01",
        bug_severity: "high",
      },
    })
  })

  it("detects query commands and maps them to existing APIs", () => {
    assert.deepEqual(buildAssistantQueryRequest(detectAssistantCommand("查询bug")!), {
      endpoint: "/api/work-plans?type=bug&limit=10",
      resultLabel: "Bug",
    })
    assert.deepEqual(buildAssistantQueryRequest(detectAssistantCommand("查询经验库")!), {
      endpoint: "/api/knowledge?category=%E7%BB%8F%E9%AA%8C%E5%BA%93",
      resultLabel: "经验库",
    })
    assert.deepEqual(buildAssistantQueryRequest(detectAssistantCommand("查询文件")!), {
      endpoint: "/api/files",
      resultLabel: "文件",
    })
  })

  it("builds safe SQL for query commands before querying Supabase", () => {
    assert.deepEqual(buildAssistantSqlQuery(detectAssistantCommand("查询bug 登录")!), {
      resultLabel: "Bug",
      table: "work_plans",
      select: "id,title,status,priority,due_date,created_at",
      filters: [{ field: "type", value: "bug" }],
      searchFields: ["title", "description", "bug_symptom"],
      searchText: "登录",
      orderBy: "created_at",
      limit: 10,
      sql: "select id,title,status,priority,due_date,created_at from work_plans where deleted_at is null and type = 'bug' and (title ilike '%登录%' or description ilike '%登录%' or bug_symptom ilike '%登录%') order by created_at desc limit 10;",
    })
  })

  it("assistant query route builds SQL before auth and keeps local admin reads explicit", () => {
    const source = readFileSync("src/app/api/assistant/query/route.ts", "utf8")

    assert.ok(source.indexOf("buildAssistantSqlQuery(command)") < source.indexOf("supabase.auth.getUser()"))
    assert.match(source, /isLocalAdminRequest\(request\)/)
    assert.match(source, /x-xmz-local-admin/)
    assert.match(source, /sql: spec\.sql/)
  })
})

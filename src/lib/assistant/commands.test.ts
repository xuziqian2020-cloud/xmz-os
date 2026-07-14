import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  ASSISTANT_COMMANDS,
  buildAssistantCreateRequest,
  buildAssistantQueryRequest,
  detectAssistantCommand,
} from "./commands"

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
})

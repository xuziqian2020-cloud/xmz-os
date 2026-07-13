import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildChatRequest, selectChatProvider } from "./chat"

describe("ai chat", () => {
  it("selects the first enabled provider with key and model", () => {
    const provider = selectChatProvider([
      { provider_name: "停用", is_enabled: false, base_url: "https://a.test/v1", api_key: "a", default_model: "a" },
      { provider_name: "启用", is_enabled: true, base_url: "https://b.test/v1", api_key: "b", default_model: "b" },
    ])

    assert.equal(provider?.provider_name, "启用")
  })

  it("builds an OpenAI-compatible chat completion request", () => {
    const request = buildChatRequest(
      { provider_name: "OpenAI", provider_type: "openai", base_url: "https://api.openai.com/v1/", api_key: "sk-test", default_model: "gpt-test" },
      [{ role: "user", content: "今天先做什么" }],
      "今日 1 项，本周 2 项"
    )

    assert.equal(request.url, "https://api.openai.com/v1/chat/completions")
    assert.equal(request.headers.Authorization, "Bearer sk-test")
    assert.equal(request.body.model, "gpt-test")
    assert.match(request.body.messages[0].content, /今日 1 项/)
  })

  it("builds an Anthropic messages request for Claude providers", () => {
    const request = buildChatRequest(
      { provider_name: "Claude", provider_type: "claude", base_url: "https://api.anthropic.com/v1", api_key: "sk-ant", default_model: "claude-test" },
      [{ role: "user", content: "整理风险" }],
      "今日 0 项，本周 3 项"
    )

    assert.equal(request.url, "https://api.anthropic.com/v1/messages")
    assert.equal(request.headers["x-api-key"], "sk-ant")
    assert.equal(request.body.model, "claude-test")
    assert.match(request.body.system, /今日 0 项/)
  })
})

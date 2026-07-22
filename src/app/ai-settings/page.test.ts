import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("本地 AI 供应商预设", () => {
  it("提供 FunASR 和 Ollama 预设，并允许分别启用", () => {
    const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8")

    assert.match(page, /key: "funasr", provider_type: "custom", label: "本地 FunASR", base_url: "http:\/\/127\.0\.0\.1:8001\/v1"/)
    assert.match(page, /key: "ollama", provider_type: "custom", label: "本地 Ollama"/)
    assert.doesNotMatch(page, /is_enabled: item\.id === provider\.id \? nextEnabled : nextEnabled \? false/)
  })
})

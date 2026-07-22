import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("会议纪要页面", () => {
  it("生成纪要时只提交本地 Ollama 会议纪要供应商", () => {
    const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8")

    assert.match(page, /selectBrowserMeetingMinutesProvider/)
    assert.match(page, /provider: selectBrowserMeetingMinutesProvider\(\)/)
  })
})

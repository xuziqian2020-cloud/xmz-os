import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildMeetingMinutesHtml, buildMeetingMinutesPrompt } from "./meeting-minutes"

describe("meeting minutes", () => {
  it("builds a Chinese minutes prompt from transcript and attendees", () => {
    const prompt = buildMeetingMinutesPrompt({
      title: "需求评审",
      attendees: ["张三", "李四"],
      transcript: "张三：今天讨论登录。李四：我负责接口。",
    })

    assert.match(prompt, /需求评审/)
    assert.match(prompt, /张三、李四/)
    assert.match(prompt, /行动项/)
  })

  it("exports meeting minutes as Word-compatible HTML", () => {
    const html = buildMeetingMinutesHtml({
      title: "需求评审",
      attendees: ["张三"],
      transcript: "张三：今天讨论登录。",
      minutes: "## 结论\n- 先做登录",
      createdAt: new Date("2026-07-09T09:30:00+08:00"),
    })

    assert.match(html, /<html/)
    assert.match(html, /需求评审/)
    assert.match(html, /先做登录/)
  })
})

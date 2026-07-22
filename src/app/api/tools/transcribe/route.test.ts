import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { POST } from "./route"

describe("会议音频转写接口", () => {
  it("使用提交的 FunASR 供应商并返回说话人标识", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async (input) => {
      assert.equal(String(input), "http://127.0.0.1:8001/v1/audio/transcriptions")
      return new Response(JSON.stringify({
        segments: [{ speaker: "SPK0", text: "开始会议" }],
      }), { status: 200 })
    }

    try {
      const form = new FormData()
      form.set("file", new File(["audio"], "meeting.webm", { type: "audio/webm" }))
      form.set("provider", JSON.stringify({
        base_url: "http://127.0.0.1:8001/v1",
        api_key: "local",
        default_model: "sensevoice",
        is_enabled: true,
      }))
      form.set("model", "sensevoice")
      form.set("diarize", "true")

      const response = await POST(new Request("http://localhost/api/tools/transcribe", { method: "POST", body: form }))

      assert.deepEqual(await response.json(), {
        text: "发言人 SPK0：开始会议",
        hasSpeakerLabels: true,
        raw: { segments: [{ speaker: "SPK0", text: "开始会议" }] },
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

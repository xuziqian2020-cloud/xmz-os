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

  it("保留 FunASR 返回的安全错误详情", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({
      detail: "FunASR 转写失败：未找到 ffmpeg",
    }), { status: 500 })

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

      const response = await POST(new Request("http://localhost/api/tools/transcribe", { method: "POST", body: form }))
      const body = await response.json()

      assert.equal(response.status, 502)
      assert.match(body.error, /FunASR 转写失败：未找到 ffmpeg/)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("兼容供应商返回的 error.message", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({
      error: { message: "供应商暂时不可用" },
    }), { status: 503 })

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

      const response = await POST(new Request("http://localhost/api/tools/transcribe", { method: "POST", body: form }))
      const body = await response.json()

      assert.equal(response.status, 502)
      assert.equal(body.error, "供应商暂时不可用")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("回退包含密码或堆栈的上游详情", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({
      detail: "FunASR 转写失败：password=TopSecret; postgres://app:dbpass@db.example/prod\n at server.py:10",
    }), { status: 500 })

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

      const response = await POST(new Request("http://localhost/api/tools/transcribe", { method: "POST", body: form }))
      const body = await response.json()

      assert.equal(response.status, 502)
      assert.equal(body.error, "转写失败：HTTP 500")
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildTranscriptionForm } from "./audio"

describe("audio transcription", () => {
  it("builds an OpenAI-compatible audio transcription form", async () => {
    const form = buildTranscriptionForm(new Blob(["hello"], { type: "audio/webm" }), {
      fileName: "meeting.webm",
      model: "gpt-4o-transcribe-diarize",
      prompt: "中文会议",
      diarize: true,
    })

    assert.equal(form.get("model"), "gpt-4o-transcribe-diarize")
    assert.equal(form.get("prompt"), "中文会议")
    assert.equal(form.get("response_format"), "json")
    assert.equal(form.get("diarize"), "true")
    assert.ok(form.get("file") instanceof File)
  })
})

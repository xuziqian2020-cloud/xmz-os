import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildTranscriptionForm, extractTranscriptionResult, supportsAudioTranscription } from "./audio"

describe("audio transcription", () => {
  it("defaults the local transcription model to sensevoice", () => {
    const form = buildTranscriptionForm(new Blob(["hello"], { type: "audio/webm" }), {
      fileName: "meeting.webm",
    })

    assert.equal(form.get("model"), "sensevoice")
  })

  it("builds an OpenAI-compatible audio transcription form", async () => {
    const form = buildTranscriptionForm(new Blob(["hello"], { type: "audio/webm" }), {
      fileName: "meeting.webm",
      model: "gpt-4o-transcribe-diarize",
      prompt: "中文会议",
      diarize: true,
    })

    assert.equal(form.get("model"), "gpt-4o-transcribe-diarize")
    assert.equal(form.get("prompt"), "中文会议")
    assert.equal(form.get("response_format"), "verbose_json")
    assert.equal(form.get("diarize"), "true")
    assert.equal(form.get("spk"), "true")
    assert.ok(form.get("file") instanceof File)
  })

  it("formats segments with speaker labels", () => {
    const result = extractTranscriptionResult({
      segments: [
        { speaker: "SPK0", text: "确认交付日期" },
        { speaker: "SPK1", text: "周五完成" },
      ],
    })

    assert.equal(result.text, "发言人 SPK0：确认交付日期\n发言人 SPK1：周五完成")
    assert.equal(result.hasSpeakerLabels, true)
  })

  it("recognizes SenseVoice as an audio transcription model", () => {
    assert.equal(supportsAudioTranscription({
      base_url: "http://127.0.0.1:8001/api",
      api_key: "local",
      default_model: "sensevoice",
    }), true)
  })
})

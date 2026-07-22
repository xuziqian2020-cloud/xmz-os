import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { selectAudioProvider, selectTextProvider } from "./provider-selection"

describe("provider selection", () => {
  const funasr = {
    provider_name: "FunASR",
    provider_type: "custom",
    base_url: "http://127.0.0.1:8000/v1",
    api_key: "local",
    default_model: "sensevoice",
    is_enabled: true,
  }
  const ollama = {
    provider_name: "Ollama",
    provider_type: "custom",
    base_url: "http://127.0.0.1:11434/v1",
    api_key: "ollama",
    default_model: "qwen3:4b",
    is_enabled: true,
  }

  it("selects FunASR only for audio transcription", () => {
    assert.equal(selectAudioProvider([ollama, funasr])?.provider_name, "FunASR")
  })

  it("excludes FunASR when selecting a text provider", () => {
    assert.equal(selectTextProvider([funasr, ollama])?.provider_name, "Ollama")
  })
})

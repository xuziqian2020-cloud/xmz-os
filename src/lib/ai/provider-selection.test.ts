import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  isAudioProvider,
  selectAudioProvider,
  selectMeetingMinutesProvider,
  selectTextProvider,
} from "./provider-selection"

describe("provider selection", () => {
  const funasr = {
    provider_name: "FunASR",
    provider_type: "custom",
    base_url: "http://127.0.0.1:8001/v1",
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
  const deepseek = {
    provider_name: "DeepSeek",
    provider_type: "deepseek",
    base_url: "https://api.deepseek.com/v1",
    api_key: "deepseek-key",
    default_model: "deepseek-chat",
    is_enabled: true,
  }

  it("selects FunASR only for audio transcription", () => {
    assert.equal(selectAudioProvider([ollama, funasr])?.provider_name, "FunASR")
  })

  it("excludes FunASR when selecting a text provider", () => {
    assert.equal(selectTextProvider([funasr, ollama])?.provider_name, "Ollama")
  })

  it("keeps local FunASR variants out of text provider selection", () => {
    const funasrVariant = {
      ...funasr,
      base_url: "http://localhost:8001/v1",
      default_model: "SenseVoiceSmall",
    }

    assert.equal(isAudioProvider(funasrVariant), true)
    assert.equal(selectTextProvider([funasrVariant, deepseek])?.provider_name, "DeepSeek")
  })

  it("selects only local Ollama for meeting minutes", () => {
    assert.equal(selectMeetingMinutesProvider([deepseek, funasr, ollama])?.provider_name, "Ollama")
    assert.equal(selectMeetingMinutesProvider([deepseek, funasr]), null)
  })
})

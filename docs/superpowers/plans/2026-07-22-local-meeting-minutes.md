# 本地会议纪要 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让会议录音经本地 FunASR 转写并按发言人分段，再使用本地 Ollama `qwen3:4b` 生成会议纪要，且不再依赖 DeepSeek。

**Architecture:** 供应商用途不写入数据库；应用以本地地址和 `sensevoice` 模型识别 FunASR 音频供应商，其他已启用供应商保持为文本供应商。会议页分别提交音频与文本供应商，两个 Next.js 路由各自验证并转发 OpenAI 兼容请求。

**Tech Stack:** Next.js App Router、TypeScript、Node.js `node:test`、FunASR OpenAI 兼容 API、Ollama OpenAI 兼容 API。

---

### Task 1: 建立供应商用途选择规则

**Files:**
- Create: `src/lib/ai/provider-selection.ts`
- Create: `src/lib/ai/provider-selection.test.ts`
- Modify: `src/lib/ai/chat.ts`
- Modify: `src/lib/ai/local-providers.ts`
- Modify: `src/lib/ai/server-provider.ts`

- [ ] **Step 1: 写出失败的供应商选择测试**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { selectAudioProvider, selectTextProvider } from "./provider-selection"

describe("provider selection", () => {
  const funasr = { provider_name: "FunASR", provider_type: "custom", base_url: "http://127.0.0.1:8001/v1", api_key: "local", default_model: "sensevoice", is_enabled: true }
  const ollama = { provider_name: "Ollama", provider_type: "custom", base_url: "http://127.0.0.1:11434/v1", api_key: "ollama", default_model: "qwen3:4b", is_enabled: true }

  it("selects FunASR only for audio transcription", () => {
    assert.equal(selectAudioProvider([ollama, funasr])?.provider_name, "FunASR")
  })

  it("excludes FunASR when selecting a text provider", () => {
    assert.equal(selectTextProvider([funasr, ollama])?.provider_name, "Ollama")
  })
})
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `npm run test -- src/lib/ai/provider-selection.test.ts`

Expected: FAIL，错误包含 `provider-selection` 模块不存在。

- [ ] **Step 3: 实现最小选择模块**

```ts
import type { AIProviderConfig } from "./chat"

export function isConfiguredProvider(provider: AIProviderConfig): boolean {
  return provider.is_enabled !== false && Boolean(provider.base_url?.trim() && provider.api_key?.trim() && provider.default_model?.trim())
}

export function isAudioProvider(provider: AIProviderConfig): boolean {
  const baseUrl = String(provider.base_url || "").replace(/\/+$/, "").toLowerCase()
  const model = String(provider.default_model || "").toLowerCase()
  return baseUrl === "http://127.0.0.1:8001/v1" && model === "sensevoice"
}

export function selectAudioProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) if (isConfiguredProvider(provider) && isAudioProvider(provider)) return provider
  return null
}

export function selectTextProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) if (isConfiguredProvider(provider) && !isAudioProvider(provider)) return provider
  return null
}
```

将 `selectChatProvider` 改为委托 `selectTextProvider`；在 `local-providers.ts` 新增 `selectBrowserAudioProvider()`；在 `server-provider.ts` 按传入的 `"audio" | "chat"` 调用相应选择函数。已有供应商没有额外字段，默认继续走文本选择。

- [ ] **Step 4: 运行选择测试与现有聊天测试**

Run: `npm run test -- src/lib/ai/provider-selection.test.ts src/lib/ai/chat.test.ts`

Expected: PASS，FunASR 与 Ollama 能同时启用，旧聊天供应商选择保持通过。

- [ ] **Step 5: 提交本任务**

```bash
git add src/lib/ai/provider-selection.ts src/lib/ai/provider-selection.test.ts src/lib/ai/chat.ts src/lib/ai/local-providers.ts src/lib/ai/server-provider.ts src/lib/ai/chat.test.ts
git commit -m "feat: separate audio and chat providers"
```

### Task 2: 让 AI 设置支持两个本地服务

**Files:**
- Modify: `src/app/ai-settings/page.tsx`

- [ ] **Step 1: 为本地预设写出可测试的纯函数**

在 `src/lib/ai/provider-selection.test.ts` 添加断言，说明 `http://127.0.0.1:8001/v1` + `sensevoice` 为音频供应商、`http://127.0.0.1:11434/v1` + `qwen3:4b` 为文本供应商。

```ts
it("treats only local SenseVoice as an audio provider", () => {
  assert.equal(isAudioProvider({ base_url: "http://127.0.0.1:8001/v1", api_key: "local", default_model: "sensevoice", is_enabled: true }), true)
  assert.equal(isAudioProvider({ base_url: "http://127.0.0.1:11434/v1", api_key: "ollama", default_model: "qwen3:4b", is_enabled: true }), false)
})
```

- [ ] **Step 2: 运行测试并确认新增断言失败**

Run: `npm run test -- src/lib/ai/provider-selection.test.ts`

Expected: FAIL，直到 `isAudioProvider` 仅匹配 FunASR 的地址与模型。

- [ ] **Step 3: 添加 FunASR 与 Ollama 预设并允许同时启用**

将预设类型拆分为展示键和持久化类型，两个本地预设仍使用已有的 `custom` 类型，避免修改 `ai_providers` 表：

```ts
{ key: "funasr", provider_type: "custom", label: "本地 FunASR", base_url: "http://127.0.0.1:8001/v1", default_model: "sensevoice", description: "本地会议音频转写与发言人区分" },
{ key: "ollama", provider_type: "custom", label: "本地 Ollama", base_url: "http://127.0.0.1:11434/v1", default_model: "qwen3:4b", description: "本地会议纪要模型" },
```

`selectPreset` 保存 `preset.provider_type`；启用/停用操作只切换当前供应商的 `is_enabled`，不得再关闭其他供应商。保留 API Key 必填校验，FunASR 使用 `local`，Ollama 使用 `ollama` 占位值。

- [ ] **Step 4: 运行供应商选择回归测试**

Run: `npm run test -- src/lib/ai/provider-selection.test.ts src/lib/ai/chat.test.ts`

Expected: PASS。

- [ ] **Step 5: 手动验证设置页**

Run: `npm run dev`

Expected: 可连续新增并同时启用“本地 FunASR”和“本地 Ollama”；刷新后两个供应商仍能被读取，聊天功能不选择 FunASR。

- [ ] **Step 6: 提交本任务**

```bash
git add src/app/ai-settings/page.tsx src/lib/ai/provider-selection.test.ts
git commit -m "feat: add local AI provider presets"
```

### Task 3: 按 FunASR 协议构造与解析转写请求

**Files:**
- Modify: `src/lib/ai/audio.ts`
- Modify: `src/lib/ai/audio.test.ts`

- [ ] **Step 1: 写出 SenseVoice、详细分段和发言人解析的失败测试**

```ts
it("requests verbose SenseVoice transcription with speaker diarization", async () => {
  const form = buildTranscriptionForm(new Blob(["audio"]), { fileName: "meeting.webm", model: "sensevoice", diarize: true })
  assert.equal(form.get("model"), "sensevoice")
  assert.equal(form.get("response_format"), "verbose_json")
  assert.equal(form.get("spk"), "true")
})

it("formats segments with speaker labels", () => {
  const result = extractTranscriptionResult({ segments: [{ speaker: "SPK0", text: "确认交付日期" }, { speaker: "SPK1", text: "周五完成" }] })
  assert.equal(result.text, "发言人 SPK0：确认交付日期\n发言人 SPK1：周五完成")
  assert.equal(result.hasSpeakerLabels, true)
})
```

- [ ] **Step 2: 运行测试并确认当前 `json` 响应格式与缺失函数导致失败**

Run: `npm run test -- src/lib/ai/audio.test.ts`

Expected: FAIL，`response_format` 为 `json`，且 `extractTranscriptionResult` 不存在。

- [ ] **Step 3: 实现 FunASR 兼容请求和解析结果**

`buildTranscriptionForm` 改为提交 `response_format=verbose_json`。当需要发言人区分时，保留通用 `diarize=true` 并额外提交 FunASR 扩展字段 `spk=true`。新增：

```ts
export type TranscriptionResult = { text: string; hasSpeakerLabels: boolean }

export function extractTranscriptionResult(data: any): TranscriptionResult {
  const segments = Array.isArray(data?.segments) ? data.segments : []
  const lines: string[] = []
  let hasSpeakerLabels = false
  for (const segment of segments) {
    const text = String(segment?.text || "").trim()
    const speaker = String(segment?.speaker || segment?.speaker_id || "").trim()
    if (!text) continue
    if (speaker) {
      hasSpeakerLabels = true
      lines.push(`发言人 ${speaker}：${text}`)
    } else {
      lines.push(text)
    }
  }
  const text = lines.length > 0 ? lines.join("\n") : String(data?.text || "").trim()
  return { text, hasSpeakerLabels }
}
```

让原有 `extractTranscriptionText` 调用此函数的 `text`，避免其他调用方回归；`supportsAudioTranscription` 明确允许 `sensevoice`。

- [ ] **Step 4: 运行音频测试**

Run: `npm run test -- src/lib/ai/audio.test.ts`

Expected: PASS，且旧表单字段测试仍通过。

- [ ] **Step 5: 提交本任务**

```bash
git add src/lib/ai/audio.ts src/lib/ai/audio.test.ts
git commit -m "feat: support FunASR transcription responses"
```

### Task 4: 接入会议页面与两个服务端路由

**Files:**
- Modify: `src/app/tools/meeting-minutes/page.tsx`
- Modify: `src/app/api/tools/transcribe/route.ts`
- Modify: `src/app/api/tools/meeting-minutes/route.ts`
- Create: `src/app/api/tools/transcribe/route.test.ts`

- [ ] **Step 1: 写出转写路由的失败测试**

```ts
it("uses the supplied FunASR provider and returns speaker metadata", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
    assert.equal(String(input), "http://127.0.0.1:8001/v1/audio/transcriptions")
    return new Response(JSON.stringify({ segments: [{ speaker: "SPK0", text: "开始会议" }] }), { status: 200 })
  }
  try {
    const form = new FormData()
    form.set("file", new File(["audio"], "meeting.webm", { type: "audio/webm" }))
    form.set("provider", JSON.stringify({ base_url: "http://127.0.0.1:8001/v1", api_key: "local", default_model: "sensevoice", is_enabled: true }))
    form.set("model", "sensevoice")
    form.set("diarize", "true")
    const response = await POST(new Request("http://localhost/api/tools/transcribe", { method: "POST", body: form }))
    assert.deepEqual(await response.json(), { text: "发言人 SPK0：开始会议", hasSpeakerLabels: true, raw: { segments: [{ speaker: "SPK0", text: "开始会议" }] } })
  } finally {
    globalThis.fetch = originalFetch
  }
})
```

- [ ] **Step 2: 运行测试并确认当前路由未返回 `hasSpeakerLabels` 而失败**

Run: `npm run test -- src/app/api/tools/transcribe/route.test.ts`

Expected: FAIL，缺少 `hasSpeakerLabels` 或音频供应商未被选择。

- [ ] **Step 3: 实现页面和路由最小改动**

在会议页面用 `selectBrowserAudioProvider()` 提交转写供应商，并使用该供应商的 `default_model`，删除固定的 `whisper-1`。纪要请求继续使用 `selectBrowserAiProvider()`，该函数在 Task 1 后只返回文本供应商。

转写路由以 `resolveServerProvider(..., "audio")` 获取供应商，使用 `extractTranscriptionResult`，返回：

```ts
return NextResponse.json({ text: result.text, hasSpeakerLabels: result.hasSpeakerLabels, raw: data })
```

会议页面在 `hasSpeakerLabels` 为 `false` 时显示“转写完成，但当前服务未返回发言人区分”；纪要路由以 `"chat"` 用途解析供应商，避免 FunASR 被误用为聊天模型。

- [ ] **Step 4: 运行路由、音频与纪要测试**

Run: `npm run test -- src/app/api/tools/transcribe/route.test.ts src/lib/ai/audio.test.ts src/lib/tools/meeting-minutes.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交本任务**

```bash
git add src/app/tools/meeting-minutes/page.tsx src/app/api/tools/transcribe/route.ts src/app/api/tools/transcribe/route.test.ts src/app/api/tools/meeting-minutes/route.ts
git commit -m "feat: use local ASR for meeting minutes"
```

### Task 5: 安装并验证本地 FunASR 服务

**Files:**
- Modify: `docs/superpowers/specs/2026-07-22-local-meeting-minutes-design.md`

- [ ] **Step 1: 安装 FunASR 的 CPU 服务依赖**

Run:

```powershell
py -m venv E:\Ollama\funasr-venv
E:\Ollama\funasr-venv\Scripts\python.exe -m pip install --upgrade pip
E:\Ollama\funasr-venv\Scripts\python.exe -m pip install funasr fastapi uvicorn python-multipart
```

Expected: 虚拟环境建立在 E 盘，安装过程不占用项目依赖目录。

- [ ] **Step 2: 写出服务健康检查的失败命令**

Run: `Invoke-WebRequest http://127.0.0.1:8001/health -UseBasicParsing`

Expected: 服务未启动时连接失败。

- [ ] **Step 3: 启动 SenseVoice OpenAI 兼容服务**

从 FunASR 官方 `examples/openai_api` 目录运行：

```powershell
E:\Ollama\funasr-venv\Scripts\python.exe server.py --model sensevoice --device cpu --port 8001
```

启动参数必须使用 `--device cpu`，因为目标机器没有 NVIDIA 独立显卡。

- [ ] **Step 4: 验证健康、模型与转写接口**

Run:

```powershell
Invoke-WebRequest http://127.0.0.1:8001/health -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:8001/v1/models -UseBasicParsing
```

Expected: 两个请求返回 HTTP 200。然后在会议页面录制短音频，确认文字、发言人提示、纪要和 Word 下载都成功。

- [ ] **Step 5: 运行全量回归与构建**

Run:

```bash
npm test
npm run build
```

Expected: 全部测试通过，Next.js 构建成功。

- [ ] **Step 6: 提交本任务**

```bash
git add docs/superpowers/specs/2026-07-22-local-meeting-minutes-design.md
git commit -m "docs: add local FunASR setup steps"
```

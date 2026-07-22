"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { CheckCircle2, PlugZap, Save, Trash2 } from "lucide-react"
import { LOCAL_AI_PROVIDERS_KEY } from "@/lib/ai/local-providers"
import { cn } from "@/lib/utils"

type ProviderPreset = {
  key: string
  provider_type: string
  label: string
  base_url: string
  default_model: string
  description: string
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  { key: "openai", provider_type: "openai", label: "OpenAI", base_url: "https://api.openai.com/v1", default_model: "gpt-4o-mini", description: "GPT 系列模型" },
  { key: "deepseek", provider_type: "deepseek", label: "DeepSeek", base_url: "https://api.deepseek.com/v1", default_model: "deepseek-chat", description: "高性价比模型" },
  { key: "claude", provider_type: "claude", label: "Claude", base_url: "https://api.anthropic.com/v1", default_model: "claude-sonnet-4-20250514", description: "Anthropic 模型" },
  { key: "qwen", provider_type: "qwen", label: "通义千问", base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1", default_model: "qwen-turbo", description: "阿里云兼容接口" },
  { key: "zhipu", provider_type: "zhipu", label: "智谱 GLM", base_url: "https://open.bigmodel.cn/api/paas/v4", default_model: "glm-4-flash", description: "智谱 AI 模型" },
  { key: "moonshot", provider_type: "moonshot", label: "Kimi", base_url: "https://api.moonshot.cn/v1", default_model: "moonshot-v1-8k", description: "月之暗面模型" },
  { key: "funasr", provider_type: "custom", label: "本地 FunASR", base_url: "http://127.0.0.1:8000/v1", default_model: "sensevoice", description: "本地会议音频转写与发言人区分" },
  { key: "ollama", provider_type: "custom", label: "本地 Ollama", base_url: "http://127.0.0.1:11434/v1", default_model: "qwen3:4b", description: "本地会议纪要模型" },
  { key: "custom", provider_type: "custom", label: "自定义", base_url: "", default_model: "", description: "自填兼容地址" },
]

const initialForm = {
  provider_name: "OpenAI",
  provider_type: "openai",
  base_url: "https://api.openai.com/v1",
  api_key: "",
  default_model: "gpt-4o-mini",
  is_enabled: true,
}

export default function AISettingsPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadProviders()
  }, [])

  async function loadProviders() {
    setLoading(true)
    const localProviders = readLocalProviders()
    try {
      const res = await fetch("/api/ai-providers")
      const data = await res.json()
      setProviders(Array.isArray(data) ? [...localProviders, ...data] : localProviders)
    } catch {
      setProviders(localProviders)
    } finally {
      setLoading(false)
    }
  }

  /** XMZADD 20260722 选中本地预设时保留数据库已有的 custom 类型 */
  function selectPreset(preset: ProviderPreset) {
    setForm({
      ...form,
      provider_name: preset.key === "custom" ? "" : preset.label,
      provider_type: preset.provider_type,
      base_url: preset.base_url,
      default_model: preset.default_model,
    })
  }

  async function saveProvider() {
    if (!form.provider_name.trim()) {
      setMessage("请输入供应商名称")
      return
    }
    if (!form.base_url.trim()) {
      setMessage("请输入 API 地址")
      return
    }
    if (!form.api_key.trim()) {
      setMessage("请输入 API Key")
      return
    }
    if (!form.default_model.trim()) {
      setMessage("请输入模型名称")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const res = await fetch("/api/ai-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        saveProviderLocally(`${data.error || "后端保存失败"}，已先保存到浏览器本地`)
        return
      }
      setForm(initialForm)
      await loadProviders()
      setMessage("供应商已保存")
    } catch {
      saveProviderLocally("后端暂不可用，已先保存到浏览器本地")
    } finally {
      setSaving(false)
    }
  }

  function saveProviderLocally(nextMessage: string) {
    const localProvider = {
      ...form,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    saveLocalProvider(localProvider)
    setProviders((prev) => [localProvider, ...prev])
    setForm(initialForm)
    setMessage(nextMessage)
  }

  async function deleteProvider(id: string) {
    if (id.startsWith("local-")) {
      deleteLocalProvider(id)
      setProviders((prev) => prev.filter((provider) => provider.id !== id))
      return
    }

    await fetch(`/api/ai-providers/${id}`, { method: "DELETE" })
    setProviders((prev) => prev.filter((provider) => provider.id !== id))
  }

  /** XMZADD 20260722 独立切换当前供应商，保障转写与纪要服务可同时启用 */
  async function toggleProviderEnabled(provider: any) {
    const nextEnabled = !provider.is_enabled
    const nextProviders = providers.map((item) => ({
      ...item,
      is_enabled: item.id === provider.id ? nextEnabled : item.is_enabled,
    }))
    setProviders(nextProviders)

    if (String(provider.id).startsWith("local-")) {
      const localProviders = nextProviders.filter((item) => String(item.id).startsWith("local-"))
      window.localStorage.setItem(LOCAL_AI_PROVIDERS_KEY, JSON.stringify(localProviders))
      return
    }

    await fetch(`/api/ai-providers/${provider.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: nextEnabled }),
    })
  }

  async function testProvider(provider: any) {
    setMessage("正在测试连接...")
    try {
      const res = await fetch("/api/ai-providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      })
      const data = await res.json()
      setMessage(res.ok ? "连接成功" : data.error || "连接失败")
    } catch {
      setMessage("连接测试失败，请检查 API 地址和 Key")
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-base text-muted-foreground">正在加载 AI 设置...</div>
  }

  const selectedPreset = PROVIDER_PRESETS.find((preset) => matchesPreset(preset, form))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">AI 设置</h1>
        <p className="mt-2 text-base text-muted-foreground">选择常用供应商后自动带出 API 地址，再填写 API Key 和模型。</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">新增供应商</h2>
          <p className="mt-1 text-sm text-muted-foreground">自定义供应商适合兼容 OpenAI 格式的中转地址。</p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => selectPreset(preset)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-colors",
                  selectedPreset?.key === preset.key
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "border-border bg-background text-foreground hover:border-emerald-500/40"
                )}
              >
                <span className="block text-sm font-semibold">{preset.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{preset.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="供应商名称">
              <input
                value={form.provider_name}
                onChange={(event) => setForm({ ...form, provider_name: event.target.value })}
                placeholder="例如：我的 OpenAI 主账号"
                className="form-input h-12 text-base"
              />
            </Field>

            <Field label="API 地址">
              <div className="relative">
                <input
                  value={form.base_url}
                  onChange={(event) => setForm({ ...form, base_url: event.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="form-input h-12 pr-10 font-mono text-base"
                />
                {selectedPreset && form.base_url === selectedPreset.base_url && form.base_url && (
                  <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
            </Field>

            <Field label="API Key">
              <input
                type="password"
                value={form.api_key}
                onChange={(event) => setForm({ ...form, api_key: event.target.value })}
                placeholder="sk-..."
                className="form-input h-12 font-mono text-base"
              />
            </Field>

            <Field label="模型名称">
              <input
                value={form.default_model}
                onChange={(event) => setForm({ ...form, default_model: event.target.value })}
                placeholder="例如：gpt-4o-mini"
                className="form-input h-12 text-base"
              />
            </Field>

            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_enabled}
                onChange={(event) => setForm({ ...form, is_enabled: event.target.checked })}
                className="h-5 w-5 rounded accent-emerald-500"
              />
              启用供应商
            </label>

            <button
              type="button"
              onClick={saveProvider}
              disabled={saving}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-base font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
            >
              <Save className="h-5 w-5" />
              {saving ? "保存中..." : "保存供应商"}
            </button>

            {message && (
              <p className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">已配置供应商</h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">{providers.length} 个</span>
          </div>

          {providers.length === 0 ? (
            <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <PlugZap className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-base font-medium">暂无 AI 供应商</p>
              <p className="mt-1 text-sm text-muted-foreground">先在左侧新增一个常用供应商。</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {providers.map((provider) => {
                const preset = PROVIDER_PRESETS.find((item) => matchesPreset(item, provider))
                return (
                  <div key={provider.id} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold">{provider.provider_name}</span>
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            {preset?.label || provider.provider_type}
                          </span>
                          {provider.is_enabled && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              已启用
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{provider.base_url}</p>
                        {provider.default_model && <p className="mt-1 text-sm text-muted-foreground">模型：{provider.default_model}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleProviderEnabled(provider)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm",
                            provider.is_enabled
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                              : "border-border hover:bg-secondary"
                          )}
                        >
                          {provider.is_enabled ? "取消启用" : "启用"}
                        </button>
                        <button
                          type="button"
                          onClick={() => testProvider(provider)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
                        >
                          <PlugZap className="h-4 w-4" />
                          测试
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProvider(provider.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function readLocalProviders() {
  try {
    const data = window.localStorage.getItem(LOCAL_AI_PROVIDERS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveLocalProvider(provider: any) {
  const providers = readLocalProviders()
  window.localStorage.setItem(LOCAL_AI_PROVIDERS_KEY, JSON.stringify([provider, ...providers]))
}

function deleteLocalProvider(id: string) {
  const providers = readLocalProviders().filter((provider: any) => provider.id !== id)
  window.localStorage.setItem(LOCAL_AI_PROVIDERS_KEY, JSON.stringify(providers))
}

/** XMZADD 20260722 以类型、地址和模型共同定位预设，避免混淆多个 custom 服务 */
function matchesPreset(preset: ProviderPreset, provider: { provider_type?: string; base_url?: string; default_model?: string }): boolean {
  return preset.provider_type === provider.provider_type
    && preset.base_url === provider.base_url
    && preset.default_model === provider.default_model
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  )
}

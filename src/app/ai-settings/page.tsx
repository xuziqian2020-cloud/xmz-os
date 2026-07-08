"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, PlugZap, Trash2 } from "lucide-react"

const providerTypes = [
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "claude", label: "Claude" },
  { value: "qwen", label: "Qwen" },
  { value: "custom", label: "自定义" },
]

const initialForm = {
  provider_name: "",
  provider_type: "openai",
  base_url: "https://api.openai.com/v1",
  api_key: "",
  default_model: "",
  is_enabled: true,
}

const LOCAL_AI_PROVIDERS_KEY = "xmz-os-local-ai-providers"

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
    const res = await fetch("/api/ai-providers")
    const data = await res.json()
    const localProviders = readLocalProviders()
    if (Array.isArray(data)) setProviders([...localProviders, ...data])
    else setProviders(localProviders)
    setLoading(false)
  }

  async function saveProvider() {
    setSaving(true)
    setMessage("")
    const res = await fetch("/api/ai-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      const localProvider = {
        ...form,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      saveLocalProvider(localProvider)
      setProviders(prev => [localProvider, ...prev])
      setForm(initialForm)
      setMessage(`${data.error || "后端保存失败"}；已先保存到浏览器本地，正式上线请补齐 Supabase 表。`)
      setSaving(false)
      return
    }
    setForm(initialForm)
    await loadProviders()
    setSaving(false)
    setMessage("供应商已保存")
  }

  async function deleteProvider(id: string) {
    if (id.startsWith("local-")) {
      deleteLocalProvider(id)
      setProviders(prev => prev.filter(p => p.id !== id))
      return
    }
    await fetch(`/api/ai-providers/${id}`, { method: "DELETE" })
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  async function testProvider(provider: any) {
    setMessage("正在测试连接...")
    const res = await fetch("/api/ai-providers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(provider),
    })
    const data = await res.json()
    setMessage(res.ok ? "连接成功" : data.error || "连接失败")
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">加载中...</div>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">AI Providers</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">AI 设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理 OpenAI、DeepSeek、Claude、Qwen 或兼容接口的供应商配置。</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">新增供应商 API</h2>
          <div className="mt-4 space-y-4">
            <Field label="供应商名称">
              <input value={form.provider_name} onChange={e => setForm({ ...form, provider_name: e.target.value })} placeholder="例如：OpenAI 主账号" className="form-input" />
            </Field>
            <Field label="供应商类型">
              <select value={form.provider_type} onChange={e => setForm({ ...form, provider_type: e.target.value })} className="form-input">
                {providerTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="API 地址">
              <input value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.openai.com/v1" className="form-input" />
            </Field>
            <Field label="API Key">
              <input type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="sk-..." className="form-input" />
            </Field>
            <Field label="默认模型">
              <input value={form.default_model} onChange={e => setForm({ ...form, default_model: e.target.value })} placeholder="gpt-4o-mini / deepseek-chat" className="form-input" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_enabled} onChange={e => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--accent))]" />
              启用供应商
            </label>
            <button onClick={saveProvider} disabled={saving} className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">
              {saving ? "保存中..." : "保存供应商"}
            </button>
            {message && <p className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">{message}</p>}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">已配置供应商</h2>
          {providers.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              暂无 AI 供应商配置
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {providers.map(p => (
                <div key={p.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{p.provider_name}</span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{p.provider_type}</span>
                        {p.is_enabled && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent))]" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.base_url}</p>
                      {p.default_model && <p className="mt-1 text-xs text-muted-foreground">默认模型：{p.default_model}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => testProvider(p)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary">
                        <PlugZap className="h-3.5 w-3.5" />
                        测试
                      </button>
                      <button onClick={() => deleteProvider(p.id)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

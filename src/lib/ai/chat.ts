export type AIChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export type AIProviderConfig = {
  id?: string
  provider_name?: string | null
  provider_type?: string | null
  base_url?: string | null
  api_key?: string | null
  default_model?: string | null
  is_enabled?: boolean | null
}

export type ChatRequestSpec = {
  url: string
  headers: Record<string, string>
  body: Record<string, any>
  responseType: "openai" | "anthropic"
}

export function selectChatProvider(providers: AIProviderConfig[]): AIProviderConfig | null {
  for (const provider of providers) {
    if (provider.is_enabled === false) continue
    if (!provider.base_url?.trim()) continue
    if (!provider.api_key?.trim()) continue
    if (!provider.default_model?.trim()) continue
    return provider
  }

  return null
}

export function buildChatRequest(provider: AIProviderConfig, messages: AIChatMessage[], context: string): ChatRequestSpec {
  const baseUrl = String(provider.base_url || "").replace(/\/+$/, "")
  const apiKey = String(provider.api_key || "")
  const model = String(provider.default_model || "")
  const systemPrompt = buildSystemPrompt(context)

  if (isAnthropicProvider(provider, baseUrl)) {
    return {
      url: `${baseUrl}/messages`,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: {
        model,
        max_tokens: 900,
        system: systemPrompt,
        messages: normalizeMessages(messages).filter((message) => message.role !== "system"),
      },
      responseType: "anthropic",
    }
  }

  return {
    url: `${baseUrl}/chat/completions`,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      model,
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizeMessages(messages),
      ],
    },
    responseType: "openai",
  }
}

export function extractChatAnswer(data: any, responseType: ChatRequestSpec["responseType"]): string {
  if (responseType === "anthropic") {
    const parts = Array.isArray(data?.content) ? data.content : []
    return parts.map((part: any) => part?.text || "").join("").trim()
  }

  return String(data?.choices?.[0]?.message?.content || "").trim()
}

function buildSystemPrompt(context: string): string {
  return [
    "你是徐小美的研发秘书小美。",
    "必须用中文回答，回答要结合当前工作台真实数据。",
    "优先指出逾期、今天截止、本周重要和本周未完成事项。",
    "不要编造不存在的计划、Bug、知识或文件。",
    context ? `当前工作台数据：${context}` : "",
  ].filter(Boolean).join("\n")
}

function normalizeMessages(messages: AIChatMessage[]): AIChatMessage[] {
  return messages
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content.trim(),
    }))
}

function isAnthropicProvider(provider: AIProviderConfig, baseUrl: string): boolean {
  return provider.provider_type === "claude" || baseUrl.includes("anthropic.com")
}

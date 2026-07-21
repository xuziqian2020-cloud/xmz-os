"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Paperclip,
  Plus,
  MessageSquareText,
  Send,
  X,
} from "lucide-react"
import { UserProfileButton } from "@/components/profile/user-profile-button"
import { ADMIN_REMEMBER_FLAG, buildLocalAdminHeaders } from "@/lib/auth/local-admin"
import { selectBrowserAiProvider } from "@/lib/ai/local-providers"
import {
  ASSISTANT_COMMANDS,
  buildAssistantCreateRequest,
  detectAssistantCommand,
  getMissingCreateInfoMessage,
  type DetectedAssistantCommand,
} from "@/lib/assistant/commands"
import { formatAssistantSqlQueryResult } from "@/lib/assistant/sql"
import {
  buildDashboardSummary,
  type DashboardPlanLike,
  type DashboardReminderLike,
} from "@/lib/dashboard/summary"
import { cn } from "@/lib/utils"

const typeLabels: Record<string, string> = {
  bug_severe: "严重 Bug",
  plan_overdue: "逾期计划",
  plan_due_soon: "即将到期",
  important_plan: "重要计划",
  weekly_candidate: "周报候选",
  custom: "提醒",
}

type ChatAttachment = {
  id: string
  name: string
  size: number
  type: string
  previewUrl?: string
  file?: File
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  attachments?: ChatAttachment[]
}

type AssistantConversation = {
  id: string
  title: string
  created_at?: string
  updated_at?: string
}

const defaultAssistantMessage = "我是小美。你可以问我今天先做什么，也可以点下面的指令让我新增或查询资料。"
const localConversationStoreKey = "xmz-os-assistant-conversations"

export default function AISecretaryPage() {
  const [adminMode, setAdminMode] = useState(false)
  const [plans, setPlans] = useState<DashboardPlanLike[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [conversationList, setConversationList] = useState<AssistantConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationError, setConversationError] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(buildDefaultChatHistory())

  useEffect(() => {
    setAdminMode(window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1")
  }, [])

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPlans() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/work-plans?limit=200", { cache: "no-store", headers: buildLocalAdminHeaders(isRememberedAdmin()) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "工作计划加载失败")
        if (!cancelled) setPlans(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) {
          setPlans([])
          setError(e.message || "工作计划加载失败")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlans()
    return () => {
      cancelled = true
    }
  }, [])

  const displayName = adminMode ? "徐小美" : "开发者"
  const summary = useMemo(() => buildDashboardSummary(plans), [plans])
  const todayReminders = summary.todayReminders
  const weekReminders = summary.weekReminders

  function handleAttachmentChange(files: FileList | null) {
    if (!files) return
    const nextAttachments = Array.from(files).map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      file,
    }))
    setAttachments((prev) => [...prev, ...nextAttachments])
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }

  async function loadConversations() {
    setConversationLoading(true)
    setConversationError("")
    try {
      const res = await fetch("/api/assistant/conversations", { cache: "no-store", headers: buildLocalAdminHeaders(isRememberedAdmin()) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "历史对话加载失败")
      const conversations = Array.isArray(data) ? data : []
      setConversationList(conversations)
      if (conversations.length > 0) {
        await loadConversationMessages(conversations[0].id)
      } else {
        setActiveConversationId(null)
        setChatHistory(buildDefaultChatHistory())
      }
    } catch (e: any) {
      const localStore = readLocalConversationStore()
      setConversationList(localStore.conversations)
      if (localStore.conversations.length > 0) {
        const first = localStore.conversations[0]
        setActiveConversationId(first.id)
        setChatHistory(localStore.messages[first.id] || buildDefaultChatHistory())
      } else {
        setActiveConversationId(null)
        setChatHistory(buildDefaultChatHistory())
      }
      setConversationError("历史对话暂存在本机，数据库迁移完成后会自动保存到 Supabase。")
    } finally {
      setConversationLoading(false)
    }
  }

  async function loadConversationMessages(conversationId: string) {
    if (conversationId.startsWith("local-")) {
      const localStore = readLocalConversationStore()
      setActiveConversationId(conversationId)
      setChatHistory(localStore.messages[conversationId] || buildDefaultChatHistory())
      setConversationError("历史对话暂存在本机，数据库迁移完成后会自动保存到 Supabase。")
      return
    }

    setConversationError("")
    try {
      const res = await fetch(`/api/assistant/conversations/${conversationId}/messages`, { cache: "no-store", headers: buildLocalAdminHeaders(isRememberedAdmin()) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "对话消息加载失败")
      const messages: ChatMessage[] = Array.isArray(data)
        ? data.map((item) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: String(item.content || ""),
            attachments: Array.isArray(item.attachments) ? item.attachments : [],
          }))
        : []
      setActiveConversationId(conversationId)
      setChatHistory(messages.length > 0 ? messages : buildDefaultChatHistory())
    } catch (e: any) {
      setConversationError(e.message || "对话消息加载失败")
    }
  }

  function startNewConversation() {
    setActiveConversationId(null)
    setChatHistory(buildDefaultChatHistory())
    setConversationError("")
  }

  async function deleteConversation(conversation: AssistantConversation) {
    if (!window.confirm(`确定删除对话「${conversation.title || "新的对话"}」吗？`)) return

    if (conversation.id.startsWith("local-")) {
      removeLocalConversation(conversation.id)
      const localStore = readLocalConversationStore()
      setConversationList(localStore.conversations)
      await switchAfterConversationDelete(conversation.id, localStore.conversations)
      return
    }

    try {
      const res = await fetch(`/api/assistant/conversations/${conversation.id}`, {
        method: "DELETE",
        headers: buildLocalAdminHeaders(isRememberedAdmin()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "删除对话失败")
      const nextConversations = conversationList.filter((item) => item.id !== conversation.id)
      setConversationList(nextConversations)
      await switchAfterConversationDelete(conversation.id, nextConversations)
    } catch (e: any) {
      setConversationError(e.message || "删除对话失败")
    }
  }

  async function switchAfterConversationDelete(conversationId: string, conversations: AssistantConversation[]) {
    if (activeConversationId !== conversationId) return
    if (conversations.length > 0) {
      await loadConversationMessages(conversations[0].id)
      return
    }
    setActiveConversationId(null)
    setChatHistory(buildDefaultChatHistory())
  }

  async function ensureConversationForMessage(text: string): Promise<string | null> {
    if (activeConversationId) return activeConversationId

    try {
      const res = await fetch("/api/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildLocalAdminHeaders(isRememberedAdmin()) },
        body: JSON.stringify({ title: buildConversationTitle(text) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "创建对话失败")
      setActiveConversationId(data.id)
      setConversationList((prev) => [data, ...prev.filter((item) => item.id !== data.id)])
      return data.id
    } catch (e: any) {
      const localConversation = createLocalConversation(text)
      setActiveConversationId(localConversation.id)
      setConversationList((prev) => [localConversation, ...prev.filter((item) => item.id !== localConversation.id)])
      setConversationError("历史对话暂存在本机，数据库迁移完成后会自动保存到 Supabase。")
      return localConversation.id
    }
  }

  async function saveConversationMessage(conversationId: string | null, message: ChatMessage, titleText?: string) {
    if (!conversationId) return
    if (conversationId.startsWith("local-")) {
      appendLocalConversationMessage(conversationId, message)
      setConversationList(readLocalConversationStore().conversations)
      return
    }

    try {
      await fetch(`/api/assistant/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildLocalAdminHeaders(isRememberedAdmin()) },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
          attachments: serializeAttachments(message.attachments),
        }),
      })
      setConversationList((prev) => prev.map((item) => item.id === conversationId ? { ...item, updated_at: new Date().toISOString() } : item))
    } catch {
      ensureLocalConversationExists(conversationId, titleText || message.content)
      appendLocalConversationMessage(conversationId, message)
      setConversationList(readLocalConversationStore().conversations)
    }
  }

  async function appendAssistantReply(content: string, conversationId: string | null) {
    const reply: ChatMessage = { role: "assistant", content }
    setChatHistory((prev) => [...prev, reply])
    await saveConversationMessage(conversationId, reply)
  }

  async function handleChatSubmit(nextText?: string) {
    const userMessage = (nextText || chatInput).trim()
    if (!userMessage && attachments.length === 0) return

    const messageAttachments = attachments
    const userChatMessage: ChatMessage = { role: "user", content: userMessage || "我上传了附件", attachments: messageAttachments }
    const nextHistory: ChatMessage[] = [...chatHistory, userChatMessage]
    setChatHistory(nextHistory)
    setChatInput("")
    setAttachments([])
    setSending(true)

    try {
      const conversationId = await ensureConversationForMessage(userMessage || "附件对话")
      await saveConversationMessage(conversationId, userChatMessage, userMessage)
      const command = detectAssistantCommand(userMessage)
      const actionReply = command ? await executeAssistantCommand(command, messageAttachments) : ""
      if (actionReply) {
        await appendAssistantReply(actionReply, conversationId)
        return
      }

      const messagesForAi = nextHistory.map((message) => ({
        role: message.role,
        content: message.attachments?.length
          ? `${message.content}\n附件：${message.attachments.map((item) => `${item.name}(${item.type || "file"})`).join("、")}`
          : message.content,
      }))
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForAi,
          context: `${buildChatContext(summary)}；当前消息附件：${messageAttachments.map((item) => item.name).join("、") || "无"}`,
          provider: selectBrowserAiProvider(),
        }),
      })
      const data = await res.json()
      await appendAssistantReply(res.ok ? data.answer : data.error || buildReply(userMessage, todayReminders.length, weekReminders.length), conversationId)
    } catch (e: any) {
      await appendAssistantReply(e.message || buildReply(userMessage, todayReminders.length, weekReminders.length), activeConversationId)
    } finally {
      setSending(false)
    }
  }

  async function executeAssistantCommand(command: DetectedAssistantCommand, files: ChatAttachment[]): Promise<string> {
    if (command.action === "query") {
      const res = await fetch(`/api/assistant/query?text=${encodeURIComponent(`${command.label}${command.bodyText ? ` ${command.bodyText}` : ""}`)}`, { cache: "no-store", headers: buildLocalAdminHeaders(isRememberedAdmin()) })
      const data = await res.json()
      if (!res.ok) return formatQueryFailure(data, command.label)
      return formatAssistantSqlQueryResult(data.sql, data.resultLabel, Array.isArray(data.rows) ? data.rows : [])
    }

    if (command.entity === "file") {
      if (files.length === 0) return getMissingCreateInfoMessage(command)
      return await uploadFilesFromAssistant(files)
    }

    if ((command.entity === "knowledge" || command.entity === "experience") && files.length > 0) {
      return await importDocumentsFromAssistant(command, files)
    }

    const request = buildAssistantCreateRequest(command)
    if (!request) return getMissingCreateInfoMessage(command)
    const res = await fetch(request.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `${command.label}失败`)
    if (request.endpoint === "/api/work-plans") setPlans((prev) => [data, ...prev])
    return `已完成${command.label}：${data.title || data.file_name || request.body.title}。`
  }

  async function uploadFilesFromAssistant(files: ChatAttachment[]): Promise<string> {
    let successCount = 0
    const errors: string[] = []
    for (const attachment of files) {
      if (!attachment.file) continue
      const formData = new FormData()
      formData.append("file", attachment.file)
      const res = await fetch("/api/files/upload", { method: "POST", body: formData })
      if (res.ok) {
        successCount += 1
      } else {
        const data = await res.json().catch(() => ({}))
        errors.push(`${attachment.name}：${data.error || "上传失败"}`)
      }
    }
    if (successCount === 0 && errors.length > 0) throw new Error(errors.join("；"))
    return `已新增文件 ${successCount} 个${errors.length > 0 ? `，失败 ${errors.length} 个：${errors.slice(0, 2).join("；")}` : ""}。`
  }

  async function importDocumentsFromAssistant(command: DetectedAssistantCommand, files: ChatAttachment[]): Promise<string> {
    let successCount = 0
    const errors: string[] = []
    for (const attachment of files) {
      if (!attachment.file) continue
      try {
        const formData = new FormData()
        formData.append("file", attachment.file)
        const extractRes = await fetch("/api/tools/extract-document", { method: "POST", body: formData })
        const extracted = await extractRes.json()
        if (!extractRes.ok) throw new Error(extracted.error || "文件解析失败")

        const saveRes = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: extracted.title || attachment.name,
            content: extracted.content || "",
            source: extracted.source || attachment.name,
            category: command.entity === "experience" ? "经验库" : "技术文档",
          }),
        })
        const saved = await saveRes.json()
        if (!saveRes.ok) throw new Error(saved.error || "保存失败")
        successCount += 1
      } catch (e: any) {
        errors.push(`${attachment.name}：${e.message || "导入失败"}`)
      }
    }
    if (successCount === 0 && errors.length > 0) throw new Error(errors.join("；"))
    return `已新增${command.entity === "experience" ? "经验" : "知识库文档"} ${successCount} 条${errors.length > 0 ? `，失败 ${errors.length} 条：${errors.slice(0, 2).join("；")}` : ""}。`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">小美待办雷达</h1>
          <p className="mt-2 text-base text-muted-foreground">按当日和本周拆开提醒，逾期和今日事项也会保留在本周视图里。</p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="mb-2 text-sm text-muted-foreground">当前账号</p>
          <UserProfileButton fallbackName={displayName} showText className="w-full p-1" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <ReminderSection title="今日待办" count={todayReminders.length} tone="today" reminders={todayReminders} emptyText={loading ? "正在读取今日待办..." : "今日暂无紧急事项"} />
          <ReminderSection title="本周关注" count={weekReminders.length} tone="week" reminders={weekReminders} emptyText={loading ? "正在读取本周待办..." : "本周暂无额外关注项"} />
        </div>

        <section className="flex h-[calc(100dvh-12rem)] min-h-[560px] flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <UserProfileButton fallbackName={displayName} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">和小美聊聊</h2>
              <p className="text-sm text-muted-foreground">本地助手按重要程度和截止日期整理</p>
            </div>
            <button
              type="button"
              onClick={startNewConversation}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              新对话
            </button>
          </div>

          <div className="border-b border-border px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">历史对话</p>
              {conversationLoading && <span className="text-xs text-muted-foreground">读取中...</span>}
            </div>
            {conversationError && <p className="mt-2 text-xs text-destructive">{conversationError}</p>}
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {conversationList.length === 0 ? (
                <span className="text-xs text-muted-foreground">当前还没有历史对话</span>
              ) : (
                conversationList.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex max-w-52 shrink-0 items-center rounded-md border border-border transition-colors",
                      activeConversationId === conversation.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => loadConversationMessages(conversation.id)}
                      className="min-w-0 flex-1 truncate px-3 py-1.5 text-left text-xs"
                    >
                      {conversation.title || "新的对话"}
                    </button>
                    <button
                      type="button"
                      aria-label={`删除对话${conversation.title || "新的对话"}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteConversation(conversation)
                      }}
                      className={cn(
                        "mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-current opacity-0 transition-opacity hover:bg-background/10 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-current group-hover:opacity-100",
                        activeConversationId === conversation.id ? "hover:bg-background/15" : "hover:bg-secondary"
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {chatHistory.map((message, index) => (
              <div key={index} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                {message.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-background">
                    <img src="/images/xiaomei-avatar.png" alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
                    message.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {message.content}
                  {message.attachments && message.attachments.length > 0 && (
                    <AttachmentPreviewList attachments={message.attachments} readonly />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={() => setCommandsOpen((open) => !open)}
              className="mb-3 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {commandsOpen ? "收起指令" : "指令"}
            </button>
            {commandsOpen && (
              <div className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
                {ASSISTANT_COMMANDS.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => setChatInput(suggestion.prompt)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
            {attachments.length > 0 && (
              <AttachmentPreviewList attachments={attachments} onRemove={removeAttachment} />
            )}
            <div className="flex items-center gap-2">
              <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground" title="发送图片或文件">
                <Paperclip className="h-5 w-5" />
                <input type="file" multiple onChange={(event) => handleAttachmentChange(event.target.files)} className="hidden" />
              </label>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleChatSubmit()}
                placeholder="输入你想问小美的问题"
                className="form-input h-12 flex-1 text-base"
              />
              <button
                type="button"
                onClick={() => handleChatSubmit()}
                disabled={sending || (!chatInput.trim() && attachments.length === 0)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function AttachmentPreviewList({
  attachments,
  onRemove,
  readonly = false,
}: {
  attachments: ChatAttachment[]
  onRemove?: (id: string) => void
  readonly?: boolean
}) {
  return (
    <div className="mt-3 grid gap-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 rounded-lg border border-border bg-background/70 p-2 text-xs">
          {attachment.previewUrl ? (
            <img src={attachment.previewUrl} alt={attachment.name} className="h-10 w-10 shrink-0 rounded object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground">
              <FileText className="h-4 w-4" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{attachment.name}</span>
            <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </span>
          {!readonly && onRemove && (
            <button type="button" onClick={() => onRemove(attachment.id)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function buildDefaultChatHistory(): ChatMessage[] {
  return [{ role: "assistant", content: defaultAssistantMessage }]
}

function buildConversationTitle(text: string): string {
  const title = text.replace(/\s+/g, " ").trim()
  if (!title) return "新的对话"
  return title.length > 28 ? `${title.slice(0, 28)}...` : title
}

function serializeAttachments(attachments?: ChatAttachment[]) {
  if (!attachments || attachments.length === 0) return []
  return attachments.map((item) => ({
    id: item.id,
    name: item.name,
    size: item.size,
    type: item.type,
    previewUrl: item.previewUrl,
  }))
}

function readLocalConversationStore(): {
  conversations: AssistantConversation[]
  messages: Record<string, ChatMessage[]>
} {
  if (typeof window === "undefined") return { conversations: [], messages: {} }
  try {
    const raw = window.localStorage.getItem(localConversationStoreKey)
    if (!raw) return { conversations: [], messages: {} }
    const parsed = JSON.parse(raw)
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      messages: parsed.messages && typeof parsed.messages === "object" ? parsed.messages : {},
    }
  } catch {
    return { conversations: [], messages: {} }
  }
}

function writeLocalConversationStore(store: {
  conversations: AssistantConversation[]
  messages: Record<string, ChatMessage[]>
}) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(localConversationStoreKey, JSON.stringify(store))
}

function createLocalConversation(titleText: string): AssistantConversation {
  const now = new Date().toISOString()
  const conversation = {
    id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: buildConversationTitle(titleText),
    created_at: now,
    updated_at: now,
  }
  const store = readLocalConversationStore()
  writeLocalConversationStore({
    conversations: [conversation, ...store.conversations],
    messages: { ...store.messages, [conversation.id]: [] },
  })
  return conversation
}

function appendLocalConversationMessage(conversationId: string, message: ChatMessage) {
  const store = readLocalConversationStore()
  const now = new Date().toISOString()
  const conversations = store.conversations.map((item) => item.id === conversationId ? { ...item, updated_at: now } : item)
  writeLocalConversationStore({
    conversations,
    messages: {
      ...store.messages,
      [conversationId]: [...(store.messages[conversationId] || []), {
        role: message.role,
        content: message.content,
        attachments: serializeAttachments(message.attachments),
      }],
    },
  })
}

function removeLocalConversation(conversationId: string) {
  const store = readLocalConversationStore()
  const messages = { ...store.messages }
  delete messages[conversationId]
  writeLocalConversationStore({
    conversations: store.conversations.filter((item) => item.id !== conversationId),
    messages,
  })
}

function ensureLocalConversationExists(conversationId: string, titleText: string) {
  const store = readLocalConversationStore()
  if (store.conversations.some((item) => item.id === conversationId)) return

  const now = new Date().toISOString()
  const conversation = {
    id: conversationId,
    title: buildConversationTitle(titleText),
    created_at: now,
    updated_at: now,
  }
  writeLocalConversationStore({
    conversations: [conversation, ...store.conversations],
    messages: { ...store.messages, [conversationId]: store.messages[conversationId] || [] },
  })
}

function isRememberedAdmin(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(ADMIN_REMEMBER_FLAG) === "1"
}

function formatQueryFailure(data: any, fallbackLabel: string): string {
  if (!data?.sql) return data?.error || `${fallbackLabel}失败`
  return `${formatAssistantSqlQueryResult(data.sql, data.resultLabel || fallbackLabel, Array.isArray(data.rows) ? data.rows : [])}\n\n查询失败：${data.error || `${fallbackLabel}失败`}`
}

function ReminderSection({
  title,
  count,
  tone,
  reminders,
  emptyText,
}: {
  title: string
  count: number
  tone: "today" | "week"
  reminders: DashboardReminderLike[]
  emptyText: string
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", tone === "today" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300")}>
          {count}
        </span>
      </div>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" />
          <p className="text-base font-medium">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </section>
  )
}

function ReminderCard({ reminder }: { reminder: DashboardReminderLike }) {
  const meta = getReminderMeta(reminder.reminder_type)
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-4">
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.className)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold">{reminder.title}</p>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            {typeLabels[reminder.reminder_type || "custom"] || "提醒"}
          </span>
        </div>
        {reminder.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{reminder.description}</p>}
      </div>
    </div>
  )
}

function getReminderMeta(type?: string | null) {
  if (type === "bug_severe") return { icon: Bug, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" }
  if (type === "plan_overdue") return { icon: AlertTriangle, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" }
  if (type === "plan_due_soon") return { icon: Clock3, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" }
  if (type === "important_plan") return { icon: AlertTriangle, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" }
  if (type === "weekly_candidate") return { icon: FileText, className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" }
  return { icon: MessageSquareText, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" }
}

function buildReply(input: string, todayCount: number, weekCount: number): string {
  if (input.includes("周报")) {
    return `周报可以按三段写：本周推进了哪些计划、今日或逾期事项如何处理、下周还剩 ${weekCount} 个关注项要继续跟进。`
  }

  if (input.includes("风险") || input.includes("建议")) {
    return `建议先看今日 ${todayCount} 个待办和本周 ${weekCount} 个关注项，逾期和本周重要计划排在普通计划前面。`
  }

  if (input.includes("今天") || input.includes("先做")) {
    return todayCount > 0 ? `今天先处理 ${todayCount} 个提醒，再按本周队列继续推进。` : `今天没有紧急提醒，可以从本周 ${weekCount} 个关注项里挑重要计划推进。`
  }

  return `收到。我会按当前待办雷达帮你拆推进顺序：今日 ${todayCount} 项优先，本周 ${weekCount} 项按重要程度和截止日期推进。`
}

function buildChatContext(summary: ReturnType<typeof buildDashboardSummary>): string {
  const today = summary.todayReminders.map((item) => `${item.title}：${item.description}`).join("；") || "无"
  const week = summary.weekReminders.map((item) => `${item.title}：${item.description}`).join("；") || "无"
  return `今日待办 ${summary.todayPlans.length} 项：${today}；本周待办 ${summary.weekPlans.length} 项：${week}；本周重要 ${summary.importantCount} 项；本周未完成 ${summary.unfinishedCount} 项；平均进度 ${summary.averageProgress}%。`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

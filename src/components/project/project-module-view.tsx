"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BarChart3, FileUp, Trash2 } from "lucide-react"
import { PlanCompletionSelect, PlanPrioritySelect } from "@/components/plans/plan-status-select"
import { buildReport, type ReportInput, type ReportKind } from "@/lib/reports/generate-report"

export type ProjectModuleKey =
  | "plans"
  | "bugs"
  | "knowledge"
  | "prompts"
  | "process"
  | "files"
  | "ideas"
  | "reports"
  | "experiences"

type ProjectModuleViewProps = {
  projectId: string
  moduleKey: ProjectModuleKey
}

const configs: Record<ProjectModuleKey, {
  title: string
  desc: string
  createHref?: (projectId: string) => string
  endpoint?: (projectId: string) => string
  empty: string
}> = {
  plans: {
    title: "项目计划",
    desc: "查看并推进该项目下的需求、Bug 和自定义计划。",
    createHref: (projectId) => `/plans/new?project_id=${projectId}`,
    endpoint: (projectId) => `/api/work-plans?project_id=${projectId}`,
    empty: "这个项目还没有计划。",
  },
  bugs: {
    title: "项目 Bug",
    desc: "只展示该项目的 Bug，可直接调整重要程度和完成状态。",
    createHref: (projectId) => `/plans/new?type=bug&project_id=${projectId}`,
    endpoint: (projectId) => `/api/work-plans?project_id=${projectId}&type=bug`,
    empty: "这个项目还没有 Bug。",
  },
  knowledge: {
    title: "项目知识库",
    desc: "沉淀该项目的方案、接口说明、会议记录和 Markdown 文档。",
    createHref: (projectId) => `/knowledge/new?project_id=${projectId}`,
    endpoint: (projectId) => `/api/knowledge?project_id=${projectId}`,
    empty: "这个项目还没有知识文档。",
  },
  prompts: {
    title: "项目 Prompt",
    desc: "管理该项目常用的提示词模板。",
    createHref: (projectId) => `/prompts/new?project_id=${projectId}`,
    endpoint: (projectId) => `/api/prompts?project_id=${projectId}`,
    empty: "这个项目还没有 Prompt。",
  },
  process: {
    title: "项目流程图",
    desc: "记录该项目的业务流程、架构流程和 Mermaid 图。",
    createHref: (projectId) => `/process/new?project_id=${projectId}`,
    endpoint: (projectId) => `/api/diagrams?project_id=${projectId}`,
    empty: "这个项目还没有流程图。",
  },
  files: {
    title: "项目文件",
    desc: "上传并管理该项目的文档、附件和交付物。",
    endpoint: (projectId) => `/api/files?project_id=${projectId}`,
    empty: "这个项目还没有文件。",
  },
  ideas: {
    title: "项目灵感",
    desc: "先捕获零散想法，再转化为计划或知识。",
    createHref: (projectId) => `/ideas/new?project_id=${projectId}`,
    endpoint: (projectId) => `/api/ideas?project_id=${projectId}`,
    empty: "这个项目还没有灵感。",
  },
  reports: {
    title: "项目报表",
    desc: "基于当前项目数据一键生成日报、周报、月报和年报。",
    empty: "这个项目还没有可生成报表的数据。",
  },
  experiences: {
    title: "项目经验库",
    desc: "复盘经验、踩坑记录和可复用结论单独归档。",
    createHref: (projectId) => `/knowledge/new?category=${encodeURIComponent("经验库")}&project_id=${projectId}`,
    endpoint: (projectId) => `/api/knowledge?project_id=${projectId}&category=${encodeURIComponent("经验库")}`,
    empty: "这个项目还没有经验沉淀。",
  },
}

export function ProjectModuleView({ projectId, moduleKey }: ProjectModuleViewProps) {
  const config = configs[moduleKey]
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [reportKind, setReportKind] = useState<ReportKind>("weekly")
  const [reportData, setReportData] = useState<ReportInput>({ projects: [], plans: [], knowledge: [], prompts: [], ideas: [] })

  useEffect(() => {
    if (moduleKey === "reports") {
      loadReportData()
      return
    }
    loadItems()
  }, [moduleKey, projectId])

  const report = useMemo(() => buildReport(reportKind, reportData), [reportKind, reportData])

  async function loadItems() {
    if (!config.endpoint) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(config.endpoint(projectId), { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "数据加载失败")
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || "数据加载失败")
    } finally {
      setLoading(false)
    }
  }

  async function loadReportData() {
    setLoading(true)
    const [plans, knowledge, prompts, ideas] = await Promise.all([
      fetchList(`/api/work-plans?project_id=${projectId}`),
      fetchList(`/api/knowledge?project_id=${projectId}`),
      fetchList(`/api/prompts?project_id=${projectId}`),
      fetchList(`/api/ideas?project_id=${projectId}`),
    ])
    setReportData({ projects: [], plans, knowledge, prompts, ideas })
    setItems([...plans, ...knowledge, ...prompts, ...ideas])
    setLoading(false)
  }

  async function handleDelete(item: any) {
    const endpoint = getDeleteEndpoint(moduleKey, item.id)
    if (!endpoint || !confirm("确定删除这条记录？")) return
    await fetch(endpoint, { method: "DELETE" })
    await loadItems()
  }

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    setError("")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("project_id", projectId)

    const res = await fetch("/api/files/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "上传失败")
    }
    await loadItems()
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{config.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{config.desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/projects/${projectId}`} prefetch={false} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            返回项目
          </Link>
          {moduleKey === "files" && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
              <FileUp className="h-4 w-4" />
              {uploading ? "上传中..." : "上传文件"}
              <input type="file" className="hidden" disabled={uploading} onChange={(event) => handleUpload(event.target.files?.[0] ?? null)} />
            </label>
          )}
          {config.createHref && (
            <Link href={config.createHref(projectId)} prefetch={false} className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
              新增
            </Link>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {moduleKey === "reports" ? (
        <ProjectReportPanel loading={loading} reportKind={reportKind} setReportKind={setReportKind} report={report} />
      ) : loading ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center text-sm text-muted-foreground">正在加载...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center text-sm text-muted-foreground">{config.empty}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ProjectModuleItem key={item.id} moduleKey={moduleKey} item={item} onDelete={() => handleDelete(item)} onItemSaved={loadItems} />
          ))}
        </div>
      )}
    </div>
  )
}

async function fetchList(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" })
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function ProjectModuleItem({ moduleKey, item, onDelete, onItemSaved }: { moduleKey: ProjectModuleKey; item: any; onDelete: () => void; onItemSaved: () => void }) {
  if (moduleKey === "plans" || moduleKey === "bugs") {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link href={`/plans/${item.id}`} prefetch={false} className="font-medium hover:text-[hsl(var(--accent))]">{item.title}</Link>
            <p className="mt-1 text-sm text-muted-foreground">{item.description || "暂无描述"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md bg-secondary px-2 py-1">{item.type === "bug" ? "Bug" : item.type === "requirement" ? "需求" : "自定义"}</span>
              <span className="rounded-md bg-secondary px-2 py-1">重要程度：{priorityLabel(item.priority)}</span>
              <span className="rounded-md bg-secondary px-2 py-1">进度：{item.progress ?? 0}%</span>
              {item.due_date && <span className="rounded-md bg-secondary px-2 py-1">截止：{item.due_date}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PlanPrioritySelect planId={item.id} type={item.type} priority={item.priority} onSaved={onItemSaved} />
            <PlanCompletionSelect planId={item.id} type={item.type} status={item.status} progress={item.progress} onSaved={onItemSaved} />
            <Link href={`/plans/${item.id}/edit`} prefetch={false} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">编辑</Link>
            <DeleteButton onClick={onDelete} />
          </div>
        </div>
      </div>
    )
  }

  const href = getItemHref(moduleKey, item.id)
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {href ? (
            <Link href={href} prefetch={false} className="font-medium hover:text-[hsl(var(--accent))]">{item.title || item.file_name || "未命名"}</Link>
          ) : (
            <p className="font-medium">{item.title || item.file_name || "未命名"}</p>
          )}
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{getItemSummary(moduleKey, item)}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {item.category && <span className="rounded-md bg-secondary px-2 py-1">{item.category}</span>}
            {item.scene && <span className="rounded-md bg-secondary px-2 py-1">{item.scene}</span>}
            {item.file_type && <span className="rounded-md bg-secondary px-2 py-1">{item.file_type}</span>}
            {item.created_at && <span className="rounded-md bg-secondary px-2 py-1">{new Date(item.created_at).toLocaleDateString("zh-CN")}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {moduleKey === "files" && item.storage_path && (
            <a href={`/api/files/${item.id}/download`} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              下载
            </a>
          )}
          {getEditHref(moduleKey, item.id) && (
            <Link href={getEditHref(moduleKey, item.id)!} prefetch={false} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              编辑
            </Link>
          )}
          {moduleKey !== "reports" && <DeleteButton onClick={onDelete} />}
        </div>
      </div>
    </div>
  )
}

function ProjectReportPanel({
  loading,
  reportKind,
  setReportKind,
  report,
}: {
  loading: boolean
  reportKind: ReportKind
  setReportKind: (kind: ReportKind) => void
  report: ReturnType<typeof buildReport>
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-2">
        {[
          ["daily", "生成日报"],
          ["weekly", "生成周报"],
          ["monthly", "生成月报"],
          ["yearly", "生成年报"],
        ].map(([kind, label]) => (
          <button
            key={kind}
            onClick={() => setReportKind(kind as ReportKind)}
            className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${reportKind === kind ? "border-[hsl(var(--accent)/0.55)] bg-[hsl(var(--accent)/0.08)]" : "border-border bg-card hover:bg-secondary/50"}`}
          >
            <BarChart3 className="h-4 w-4 text-[hsl(var(--accent))]" />
            {label}
          </button>
        ))}
      </div>
      <textarea
        readOnly
        value={loading ? "正在生成报表..." : report.content}
        className="min-h-[32rem] rounded-lg border border-border bg-card p-4 font-mono text-sm leading-6 outline-none"
      />
    </section>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
      <Trash2 className="h-3.5 w-3.5" />
      删除
    </button>
  )
}

function getDeleteEndpoint(moduleKey: ProjectModuleKey, id: string) {
  if (moduleKey === "plans" || moduleKey === "bugs") return `/api/work-plans/${id}`
  if (moduleKey === "knowledge" || moduleKey === "experiences") return `/api/knowledge/${id}`
  if (moduleKey === "prompts") return `/api/prompts/${id}`
  if (moduleKey === "process") return `/api/diagrams/${id}`
  if (moduleKey === "files") return `/api/files/${id}`
  if (moduleKey === "ideas") return `/api/ideas/${id}`
  return null
}

function getItemHref(moduleKey: ProjectModuleKey, id: string) {
  if (moduleKey === "knowledge" || moduleKey === "experiences") return `/knowledge/${id}`
  if (moduleKey === "process") return `/process/${id}`
  if (moduleKey === "ideas") return `/ideas/${id}/edit`
  return null
}

function getEditHref(moduleKey: ProjectModuleKey, id: string) {
  if (moduleKey === "knowledge" || moduleKey === "experiences") return `/knowledge/${id}/edit`
  if (moduleKey === "ideas") return `/ideas/${id}/edit`
  return null
}

function getItemSummary(moduleKey: ProjectModuleKey, item: any) {
  if (moduleKey === "files") return item.file_size ? `${formatSize(item.file_size)}，点击下载查看` : "文件已上传"
  if (moduleKey === "prompts") return item.content || "暂无 Prompt 内容"
  if (moduleKey === "process") return item.description || item.mermaid_content || "暂无流程图描述"
  return item.content || item.description || "暂无内容"
}

function priorityLabel(value?: string) {
  if (value === "high") return "重要"
  if (value === "medium") return "中等"
  return "低"
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

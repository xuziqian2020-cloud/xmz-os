"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarDays, ClipboardCopy, FileText, RefreshCw } from "lucide-react"
import { buildReport, type ReportInput, type ReportKind } from "@/lib/reports/generate-report"

const reportTypes: Array<{ type: ReportKind; label: string; desc: string }> = [
  { type: "daily", label: "生成日报", desc: "适合记录今天推进、阻塞和明日计划" },
  { type: "weekly", label: "生成周报", desc: "汇总本周计划、产出、风险和下周重点" },
  { type: "monthly", label: "生成月报", desc: "整理项目进展、知识沉淀和阶段问题" },
  { type: "yearly", label: "生成年报", desc: "回顾全年研发资产、项目成果和经验库" },
]

const emptyInput: ReportInput = { projects: [], plans: [], knowledge: [], prompts: [], ideas: [] }

export default function ReportsPage() {
  const [data, setData] = useState<ReportInput>(emptyInput)
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<ReportKind>("weekly")
  const [content, setContent] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const currentReport = useMemo(() => buildReport(activeType, data), [activeType, data])

  async function loadData() {
    setLoading(true)
    const [projects, plans, knowledge, prompts, ideas] = await Promise.all([
      fetchJson("/api/projects"),
      fetchJson("/api/work-plans"),
      fetchJson("/api/knowledge"),
      fetchJson("/api/prompts"),
      fetchJson("/api/ideas"),
    ])
    setData({ projects, plans, knowledge, prompts, ideas })
    setLoading(false)
  }

  function generate(type: ReportKind) {
    setActiveType(type)
    setContent(buildReport(type, data).content)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Reports</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">报表总结</h1>
          <p className="mt-1 text-sm text-muted-foreground">一键生成日报、周报、月报、年报，并用看板观察当前研发资产。</p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
          <RefreshCw className="h-4 w-4" />
          刷新数据
        </button>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="项目" value={currentReport.stats.projectCount} />
        <Metric label="工作计划" value={currentReport.stats.planCount} />
        <Metric label="知识/经验" value={currentReport.stats.knowledgeCount} />
        <Metric label="Prompt/灵感" value={currentReport.stats.promptCount + currentReport.stats.ideaCount} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-3">
          {reportTypes.map(item => (
            <button
              key={item.type}
              onClick={() => generate(item.type)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${activeType === item.type ? "border-[hsl(var(--accent)/0.55)] bg-[hsl(var(--accent)/0.08)]" : "border-border bg-card hover:bg-secondary/50"}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-[hsl(var(--accent))]">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.desc}</span>
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span className="text-sm font-semibold">{currentReport.title}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(content || currentReport.content)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              复制
            </button>
          </div>
          <textarea
            value={content || (loading ? "正在读取数据..." : currentReport.content)}
            onChange={e => setContent(e.target.value)}
            className="min-h-[34rem] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 outline-none"
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[hsl(var(--accent))]" />
          <h2 className="text-sm font-semibold">研发看板</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <BoardItem label="进行中计划" value={currentReport.stats.activePlanCount} />
          <BoardItem label="已完成计划" value={currentReport.stats.donePlanCount} />
          <BoardItem label="高优先级事项" value={currentReport.stats.highPlanCount} />
        </div>
      </section>
    </div>
  )
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function BoardItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/35 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}

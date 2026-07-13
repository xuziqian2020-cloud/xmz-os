"use client"

import { useMemo, useState } from "react"
import { BarChart3, CalendarDays, ClipboardCopy, Download, FileText, RefreshCw } from "lucide-react"
import {
  buildReport,
  buildReportDocumentHtml,
  type ReportInput,
  type ReportKind,
} from "@/lib/reports/generate-report"
import { cn } from "@/lib/utils"

const reportTypes: Array<{ type: ReportKind; label: string; desc: string }> = [
  { type: "daily", label: "日报", desc: "记录今天推进、阻塞和明日计划" },
  { type: "weekly", label: "周报", desc: "汇总本周计划、产出、风险和下周重点" },
  { type: "monthly", label: "月报", desc: "整理项目进展、知识沉淀和阶段问题" },
  { type: "yearly", label: "年报", desc: "回顾全年研发资产、项目成果和经验库" },
]

const emptyInput: ReportInput = { projects: [], plans: [], knowledge: [], prompts: [], ideas: [] }

export function ReportsClient({ initialData }: { initialData: ReportInput }) {
  const data = initialData ?? emptyInput
  const [activeType, setActiveType] = useState<ReportKind>("weekly")
  const [content, setContent] = useState("")
  const [format, setFormat] = useState<"markdown" | "word">("markdown")
  const [refreshing, setRefreshing] = useState(false)

  const currentReport = useMemo(() => buildReport(activeType, data), [activeType, data])
  const displayContent = content || currentReport.content
  const wordHtml = useMemo(() => buildReportDocumentHtml(currentReport, data), [currentReport, data])

  function refreshData() {
    setRefreshing(true)
    window.location.reload()
  }

  function selectReport(type: ReportKind) {
    setActiveType(type)
    setContent("")
  }

  function copyReport() {
    navigator.clipboard.writeText(format === "word" ? wordHtml : displayContent)
  }

  function exportWord() {
    const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${currentReport.label}_${new Date().toISOString().slice(0, 10)}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">报表总结</h1>
          <p className="mt-2 text-base text-muted-foreground">日报、周报、月报、年报都支持 Markdown 和 Word 文档格式。</p>
        </div>
        <button
          type="button"
          onClick={refreshData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:bg-secondary"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "刷新中" : "刷新数据"}
        </button>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="项目" value={currentReport.stats.projectCount} />
        <Metric label="工作计划" value={currentReport.stats.planCount} />
        <Metric label="知识/经验" value={currentReport.stats.knowledgeCount} />
        <Metric label="Prompt/灵感" value={currentReport.stats.promptCount + currentReport.stats.ideaCount} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-3">
          {reportTypes.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => selectReport(item.type)}
              className={cn(
                "w-full rounded-xl border p-5 text-left transition-colors",
                activeType === item.type
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-border bg-card hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-emerald-600">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.desc}</span>
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="text-base font-semibold">{currentReport.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border bg-secondary p-0.5">
                <button
                  type="button"
                  onClick={() => setFormat("markdown")}
                  className={cn("rounded-md px-3 py-1.5 text-sm font-medium", format === "markdown" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("word")}
                  className={cn("rounded-md px-3 py-1.5 text-sm font-medium", format === "word" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  Word
                </button>
              </div>
              <button
                type="button"
                onClick={copyReport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ClipboardCopy className="h-4 w-4" />
                复制
              </button>
              <button
                type="button"
                onClick={exportWord}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                <Download className="h-4 w-4" />
                导出 Word
              </button>
            </div>
          </div>

          {format === "markdown" ? (
            <textarea
              value={displayContent}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[34rem] w-full resize-y bg-transparent p-5 font-mono text-sm leading-7 outline-none"
            />
          ) : (
            <iframe
              title="Word 文档预览"
              srcDoc={wordHtml}
              className="min-h-[34rem] w-full rounded-b-xl bg-white"
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold">研发看板</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <BoardItem label="未完成计划" value={currentReport.stats.activePlanCount} />
          <BoardItem label="已完成计划" value={currentReport.stats.donePlanCount} />
          <BoardItem label="重要事项" value={currentReport.stats.highPlanCount} />
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function BoardItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

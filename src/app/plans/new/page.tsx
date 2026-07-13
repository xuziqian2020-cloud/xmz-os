"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { normalizePriority, priorityToLabel } from "@/lib/work-plans/status-rules"

const typeOptions = [
  { value: "requirement", label: "需求" },
  { value: "bug", label: "Bug" },
  { value: "custom", label: "自定义" },
]

const priorityOptions = ["high", "medium", "low"]

export default function NewPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetType = searchParams.get("type") || "requirement"
  const presetProjectId = searchParams.get("project_id") || ""

  const [type, setType] = useState(presetType)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [projectId, setProjectId] = useState(presetProjectId)
  const [dueDate, setDueDate] = useState("")
  const [sourcePerson, setSourcePerson] = useState("")
  const [requirementBg, setRequirementBg] = useState("")
  const [bugSymptom, setBugSymptom] = useState("")
  const [bugErrorMessage, setBugErrorMessage] = useState("")
  const [bugReason, setBugReason] = useState("")
  const [bugSolution, setBugSolution] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const dueDateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data)
      })
      .catch(() => setProjects([]))
  }, [])

  async function handleSubmit() {
    if (!title.trim()) return

    setLoading(true)
    setError("")

    const body: any = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      status: "进行中",
      priority: normalizePriority(priority),
      project_id: projectId || undefined,
      due_date: dueDate || dueDateRef.current?.value || undefined,
      progress: 0,
    }

    if (type === "bug") {
      body.bug_severity = normalizePriority(priority)
      if (bugSymptom.trim()) body.bug_symptom = bugSymptom.trim()
      if (bugErrorMessage.trim()) body.bug_error_message = bugErrorMessage.trim()
      if (bugReason.trim()) body.bug_reason = bugReason.trim()
      if (bugSolution.trim()) body.bug_solution = bugSolution.trim()
    }
    if (type === "requirement") {
      if (sourcePerson.trim()) body.source_person = sourcePerson.trim()
      if (requirementBg.trim()) body.requirement_background = requirementBg.trim()
    }

    const res = await fetch("/api/work-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "创建失败")
      setLoading(false)
      return
    }

    const plan = await res.json()
    router.push(presetProjectId ? `/projects/${presetProjectId}` : `/plans/${plan.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">新建计划</h1>
        <p className="mt-2 text-base text-muted-foreground">新建后默认进行中，重要程度可在列表和工作台直接调整。</p>
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-card p-6">
        <Field label="类型">
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${type === option.value ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="标题">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入计划标题" className="form-input h-12 text-base" />
        </Field>

        <Field label="描述">
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="补充业务背景、现象或验收点" className="form-input min-h-[96px] resize-none text-base" />
        </Field>

        <Field label="重要程度">
          <div className="grid grid-cols-3 gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPriority(option)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${priority === option ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}
              >
                {priorityToLabel(option)}
              </button>
            ))}
          </div>
        </Field>

        <Field label="所属项目">
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="form-input h-12 text-base">
            <option value="">{projects.length === 0 ? "自动归入默认项目" : "不选则自动归入默认项目"}</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </Field>

        <Field label="截止日期">
          <input ref={dueDateRef} type="date" value={dueDate} onInput={(event) => setDueDate(event.currentTarget.value)} onChange={(event) => setDueDate(event.target.value)} className="form-input h-12 text-base" />
        </Field>

        {type === "requirement" && (
          <>
            <Field label="需求来源">
              <input value={sourcePerson} onChange={(event) => setSourcePerson(event.target.value)} placeholder="谁提出的需求" className="form-input h-12 text-base" />
            </Field>
            <Field label="需求背景">
              <textarea value={requirementBg} onChange={(event) => setRequirementBg(event.target.value)} rows={2} placeholder="为什么要做这个需求" className="form-input min-h-[80px] resize-none text-base" />
            </Field>
          </>
        )}

        {type === "bug" && (
          <>
            <Field label="Bug 现象">
              <textarea value={bugSymptom} onChange={(event) => setBugSymptom(event.target.value)} rows={2} placeholder="用户看到的问题或复现路径" className="form-input min-h-[80px] resize-none text-base" />
            </Field>
            <Field label="错误信息">
              <textarea value={bugErrorMessage} onChange={(event) => setBugErrorMessage(event.target.value)} rows={2} placeholder="报错文本、接口返回或日志关键内容" className="form-input min-h-[80px] resize-none text-base" />
            </Field>
            <Field label="原因分析">
              <textarea value={bugReason} onChange={(event) => setBugReason(event.target.value)} rows={2} placeholder="定位到的业务原因或技术原因" className="form-input min-h-[80px] resize-none text-base" />
            </Field>
            <Field label="处理方案">
              <textarea value={bugSolution} onChange={(event) => setBugSolution(event.target.value)} rows={2} placeholder="修复方案、验证方法或暂缓说明" className="form-input min-h-[80px] resize-none text-base" />
            </Field>
          </>
        )}

        {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || loading}
          className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "创建中..." : "创建计划"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          取消
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  )
}

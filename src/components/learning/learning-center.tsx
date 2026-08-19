"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, ChevronRight, CircleDot, FileText, FolderKanban, NotebookPen, Play, ShieldCheck } from "lucide-react"
import {
  enterpriseProjects,
  getGraduationStatus,
  getUnlockedPractices,
  learningModules,
  miniPractices,
  type LearningTrack,
} from "@/lib/learning/catalog"

interface ProgressRow {
  content_type: "lesson" | "practice" | "project"
  content_slug: string
  status: "in_progress" | "completed" | "accepted"
  score?: number | null
}

const trackLabels: Record<LearningTrack, string> = {
  general: "毕业项目",
  k3: "金蝶云星空专项",
  manufacturing: "制造 ERP 实战",
}

const trackDescriptions: Record<LearningTrack, string> = {
  general: "必须完成 10 个公司可用的 Agent 产品",
  k3: "金蝶二开人员的云星空 AI 专项作品库",
  manufacturing: "离散制造全链路的业务闭环作品库",
}

/** XMZADD 20260819 汇总已完成课程携带的能力标签，用于计算项目解锁。 */
function collectCompletedSkills(progress: ProgressRow[]) {
  const completedLessons = new Set(progress.filter((item) => item.content_type === "lesson" && item.status !== "in_progress").map((item) => item.content_slug))
  const skills = new Set<string>()

  for (const module of learningModules) {
    for (const lesson of module.lessons) {
      if (!completedLessons.has(lesson.slug)) continue
      for (const skill of lesson.skills) skills.add(skill)
    }
  }

  return Array.from(skills)
}

/** XMZADD 20260819 呈现学习中心首页并根据进度安排下一课与即时实战。 */
export function LearningCenter() {
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [offlineHint, setOfflineHint] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadProgress() {
      try {
        const response = await fetch("/api/learning/progress", { cache: "no-store" })
        if (!response.ok) throw new Error("学习进度暂时无法同步")
        const data = await response.json()
        if (!cancelled) setProgress(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setOfflineHint("当前处于本地预览：完成状态会在 Supabase 配置后同步。")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProgress()
    return () => { cancelled = true }
  }, [])

  const lessonList = useMemo(() => learningModules.flatMap((module) => module.lessons), [])
  const completedLessonSlugs = useMemo(() => new Set(progress.filter((item) => item.content_type === "lesson" && item.status !== "in_progress").map((item) => item.content_slug)), [progress])
  const completedPracticeSlugs = useMemo(() => new Set(progress.filter((item) => item.content_type === "practice" && item.status !== "in_progress").map((item) => item.content_slug)), [progress])
  const acceptedProjectSlugs = useMemo(() => progress.filter((item) => item.content_type === "project" && item.status === "accepted").map((item) => item.content_slug), [progress])
  const currentLesson = lessonList.find((lesson) => !completedLessonSlugs.has(lesson.slug)) ?? lessonList[lessonList.length - 1]
  const completedSkills = useMemo(() => collectCompletedSkills(progress), [progress])
  const nextPractice = useMemo(() => getUnlockedPractices(completedSkills).find((practice) => !completedPracticeSlugs.has(practice.slug)), [completedPracticeSlugs, completedSkills])
  const graduation = useMemo(() => getGraduationStatus(acceptedProjectSlugs), [acceptedProjectSlugs])
  const lessonCompletion = Math.round((completedLessonSlugs.size / lessonList.length) * 100)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">学习中心</h1>
          <p className="mt-2 text-sm text-muted-foreground">从零开始，边学边做。每完成一个能力包，就安排一个可运行的实战。</p>
        </div>
        <Link href="/learning/notes" prefetch={false} className="inline-flex items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:self-auto">
          <NotebookPen className="h-4 w-4" />
          独立笔记
        </Link>
      </header>

      {offlineHint && <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">{offlineHint}</div>}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">36 个月学习路径</h2>
        </div>
        <div className="overflow-x-auto">
          <ol className="grid min-w-[800px] grid-cols-8 divide-x divide-border">
            {learningModules.map((module, index) => (
              <li key={module.slug} className="relative px-4 py-5">
                <span className={`mb-4 block h-3 w-3 rounded-full border-2 ${index === 0 ? "border-primary bg-primary" : "border-muted-foreground/50 bg-card"}`} />
                <p className="text-xs text-muted-foreground">{module.months}</p>
                <p className="mt-1 text-sm font-medium leading-5">{module.title}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">当前学习</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">{currentLesson.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{currentLesson.summary}</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border text-foreground"><BookOpen className="h-5 w-5" /></div>
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lessonCompletion}%` }} /></div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>课程完成度 {lessonCompletion}%</span><span>{currentLesson.duration}</span></div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/learning/lessons/${currentLesson.slug}`} prefetch={false} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">继续学习 <ChevronRight className="h-4 w-4" /></Link>
            {!completedLessonSlugs.has(currentLesson.slug) && <span className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">通过代码练习后自动完成</span>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">现在开始做</p>
          {loading ? <p className="mt-6 text-sm text-muted-foreground">正在计算你的实战安排...</p> : nextPractice ? (
            <>
              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border"><FileText className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-semibold">{nextPractice.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{nextPractice.summary}</p></div>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">预计 {nextPractice.duration} · 交付：{nextPractice.deliverable}</p>
              <Link href={`/learning/practice/${nextPractice.slug}`} prefetch={false} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Play className="h-4 w-4" />开始实战</Link>
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">先完成当前课程的代码练习。完成后，这里会直接安排与你刚学能力匹配的项目。</div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">项目路线图</h2><p className="mt-1 text-xs text-muted-foreground">所有项目都有业务目标、数据契约、测试、UAT、运行手册与扩展练习。</p></div><span className="text-sm font-medium">毕业项目 {graduation.accepted} / {graduation.required}</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">路线</th><th className="px-5 py-3 font-medium">项目</th><th className="px-5 py-3 font-medium">定位</th><th className="px-5 py-3 font-medium">完成度</th><th className="px-5 py-3 font-medium" /></tr></thead>
            <tbody className="divide-y divide-border">
              {(["general", "k3", "manufacturing"] as LearningTrack[]).map((track) => {
                const projects = enterpriseProjects.filter((project) => project.track === track)
                const acceptedCount = projects.filter((project) => acceptedProjectSlugs.includes(project.slug)).length
                return <tr key={track} className="hover:bg-secondary/30"><td className="px-5 py-4 font-medium">{trackLabels[track]}</td><td className="px-5 py-4">{projects.length} 个企业级项目</td><td className="px-5 py-4 text-muted-foreground">{trackDescriptions[track]}</td><td className="px-5 py-4">{acceptedCount} / {projects.length}</td><td className="px-5 py-4 text-right"><Link href={`/learning/projects/${projects[0].slug}`} prefetch={false} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">查看项目 <ChevronRight className="h-4 w-4" /></Link></td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <LearningFact icon={<CircleDot className="h-4 w-4" />} title="练习规则" text={`${miniPractices.length} 个小实战不计入毕业，用来让知识刚学完就立刻变成代码。`} />
        <LearningFact icon={<ShieldCheck className="h-4 w-4" />} title="企业安全" text="所有业务 Agent 默认只读；写入、单据提交和接口动作都必须人工确认。" />
        <LearningFact icon={<FolderKanban className="h-4 w-4" />} title="作品集" text="通用 10 项全部验收后毕业；金蝶和制造 ERP 路线持续沉淀行业交付案例。" />
      </section>
    </div>
  )
}

function LearningFact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl border border-border bg-card p-4"><span className="mt-0.5 text-muted-foreground">{icon}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></div>
}

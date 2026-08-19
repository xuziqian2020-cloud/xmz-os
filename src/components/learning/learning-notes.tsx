"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, NotebookPen, Save } from "lucide-react"
import { enterpriseProjects, learningModules } from "@/lib/learning/catalog"

interface Note {
  content: string
  target_type: "lesson" | "practice" | "project"
  target_slug: string
}

/** XMZADD 20260819 提供独立于知识库的学习笔记编辑与保存功能。 */
export function LearningNotes() {
  const targets = useMemo(() => [
    ...learningModules.flatMap((module) => module.lessons.map((lesson) => ({ type: "lesson" as const, slug: lesson.slug, label: `课程 · ${lesson.title}` }))),
    ...enterpriseProjects.map((project) => ({ type: "project" as const, slug: project.slug, label: `项目 · ${project.title}` })),
  ], [])
  const [targetKey, setTargetKey] = useState(`${targets[0].type}:${targets[0].slug}`)
  const [notes, setNotes] = useState<Note[]>([])
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [targetType, targetSlug] = targetKey.split(":") as ["lesson" | "project", string]

  useEffect(() => {
    let cancelled = false
    fetch("/api/learning/notes", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => { if (!cancelled) setNotes(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setMessage("笔记将在 Supabase 配置后同步。") })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setContent(notes.find((note) => note.target_type === targetType && note.target_slug === targetSlug)?.content || "")
  }, [notes, targetSlug, targetType])

  async function saveNote() {
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/learning/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_type: targetType, target_slug: targetSlug, content }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "笔记保存失败")
      setNotes((current) => [...current.filter((note) => !(note.target_type === targetType && note.target_slug === targetSlug)), data])
      setMessage("笔记已保存。")
    } catch (error: any) {
      setMessage(error.message || "笔记暂时无法保存")
    } finally {
      setSaving(false)
    }
  }

  return <div className="mx-auto max-w-5xl space-y-6"><header className="border-b border-border pb-5"><h1 className="text-2xl font-semibold tracking-tight">独立笔记</h1><p className="mt-2 text-sm text-muted-foreground">把概念、代码错误、业务判断和项目复盘放在学习路径中，不混入项目知识库。</p></header><div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><aside className="rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4" />关联学习内容</div><select value={targetKey} onChange={(event) => setTargetKey(event.target.value)} className="mt-4 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20">{targets.map((target) => <option key={`${target.type}:${target.slug}`} value={`${target.type}:${target.slug}`}>{target.label}</option>)}</select><p className="mt-4 text-xs leading-5 text-muted-foreground">建议记录：自己的解释、运行错误、业务口径和下一次要验证的问题。</p></aside><section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><NotebookPen className="h-4 w-4" />学习笔记</h2><button type="button" disabled={saving} onClick={saveNote} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "保存中..." : "保存笔记"}</button></div><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="用自己的话写下理解；以后回看时才会真正有用。" className="mt-4 min-h-[420px] w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" />{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}</section></div></div>
}

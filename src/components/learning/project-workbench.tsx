"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, ShieldCheck } from "lucide-react"
import { getCompletedSkills, getUnmetPrerequisites, type EnterpriseProject } from "@/lib/learning/catalog"

interface Evidence {
  id: string
  title: string
  url: string | null
  evidence_type: string
  status: string
}

/** XMZADD 20260819 展示企业项目的完整交付教程并收集可审核的作品证据。 */
export function ProjectWorkbench({ project }: { project: EnterpriseProject }) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [accessGaps, setAccessGaps] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/learning/evidence?project_slug=${encodeURIComponent(project.slug)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => { if (!cancelled) setEvidence(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setMessage("项目证据将在 Supabase 配置后同步。") })
    return () => { cancelled = true }
  }, [project.slug])

  useEffect(() => {
    let cancelled = false

    async function loadAccess() {
      try {
        const response = await fetch("/api/learning/progress", { cache: "no-store" })
        if (!response.ok) throw new Error()
        const progress = await response.json()
        const completedLessons = Array.isArray(progress)
          ? progress.filter((item) => item.content_type === "lesson" && item.status !== "in_progress").map((item) => item.content_slug)
          : []
        if (!cancelled) setAccessGaps(getUnmetPrerequisites(project.prerequisites, getCompletedSkills(completedLessons)))
      } catch {
        if (!cancelled) setAccessGaps(project.prerequisites)
      }
    }

    loadAccess()
    return () => { cancelled = true }
  }, [project])

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (accessGaps.length > 0) {
      setMessage(`请先完成前置能力：${accessGaps.join("、")}`)
      return
    }
    const form = new FormData(event.currentTarget)
    const payload = {
      project_slug: project.slug,
      evidence_type: String(form.get("evidence_type") || "repository"),
      title: String(form.get("title") || ""),
      url: String(form.get("url") || ""),
      notes: String(form.get("notes") || ""),
    }
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/learning/evidence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "项目证据保存失败")
      setEvidence((current) => [data, ...current])
      event.currentTarget.reset()
      setMessage("项目证据已保存，下一步请按 UAT 清单与业务负责人验收。")
    } catch (error: any) {
      setMessage(error.message || "项目证据暂时无法保存")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/learning" prefetch={false} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回学习中心</Link>
      <header className="border-b border-border pb-5"><p className="text-sm text-muted-foreground">{project.track === "general" ? "通用 Agent 毕业项目" : project.track === "k3" ? "金蝶云星空专项" : "制造 ERP 实战"} · 预计 {project.duration}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{project.number}. {project.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{project.outcome}</p></header>

      {accessGaps.length > 0 && <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-muted-foreground">项目教程可提前阅读，但尚不能提交交付证据。请先完成：{accessGaps.join("、")}。</section>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <GuideSection title="1. 业务背景与 KPI" icon={<ClipboardCheck className="h-4 w-4" />}><p>{project.guide.businessBackground}</p><p className="mt-3 font-medium text-foreground">验收 KPI：{project.guide.kpi}</p></GuideSection>
          <GuideSection title="2. 角色、权限与数据契约" icon={<ShieldCheck className="h-4 w-4" />}><p>{project.guide.roles}</p><p className="mt-3">{project.guide.dataContract}</p></GuideSection>
          <GuideSection title="3. 从零构建任务" icon={<CheckCircle2 className="h-4 w-4" />}><ol className="space-y-3">{project.guide.buildSteps.map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium">{index + 1}</span><span>{step}</span></li>)}</ol></GuideSection>
          <GuideSection title="4. 评测与 UAT" icon={<CheckCircle2 className="h-4 w-4" />}><div className="grid gap-4 md:grid-cols-2"><Checklist title="自动与离线测试" items={project.guide.tests} /><Checklist title="业务 UAT" items={project.guide.uat} /></div></GuideSection>
          <GuideSection title="5. 部署、运行与故障排查" icon={<ShieldCheck className="h-4 w-4" />}><Checklist title="运行手册" items={project.guide.runbook} /><Checklist title="常见问题" items={project.guide.troubleshooting} /><p className="mt-4 rounded-lg bg-secondary/60 p-3 text-sm leading-6 text-muted-foreground">扩展练习：{project.guide.extension}</p></GuideSection>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">开始前检查</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{project.prerequisites.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />{item}</li>)}</ul><Link href="/learning/notes" prefetch={false} className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">记录项目笔记</Link></div>
          <div className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">交付证据</h2><form onSubmit={submitEvidence} className="mt-4 space-y-3"><input name="title" required placeholder="例如：Git 仓库地址" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" /><select name="evidence_type" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="repository">代码仓库</option><option value="deployment">部署地址</option><option value="screenshot">演示截图</option><option value="test_result">测试结果</option><option value="retrospective">复盘记录</option></select><input name="url" placeholder="https://...（可选）" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" /><textarea name="notes" rows={3} placeholder="本次交付说明、测试结果或待改进项" className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20" /><button disabled={saving} className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60">{saving ? "保存中..." : "提交项目证据"}</button></form>{message && <p className="mt-3 text-xs leading-5 text-muted-foreground">{message}</p>}<div className="mt-5 space-y-2">{evidence.length === 0 ? <p className="text-xs text-muted-foreground">还没有证据。先完成最小可运行版本，再提交仓库或测试结果。</p> : evidence.map((item) => <div key={item.id} className="rounded-md border border-border p-3 text-xs"><p className="font-medium text-foreground">{item.title}</p><p className="mt-1 text-muted-foreground">{item.evidence_type} · {item.status}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary hover:underline">打开证据 <ExternalLink className="h-3 w-3" /></a>}</div>)}</div></div>
        </aside>
      </div>
    </div>
  )
}

function GuideSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2><div className="mt-4 text-sm leading-7 text-muted-foreground">{children}</div></section>
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="text-sm font-semibold text-foreground">{title}</h3><ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" /><span>{item}</span></li>)}</ul></div>
}

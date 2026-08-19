"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, Code2, TerminalSquare } from "lucide-react"
import { getCompletedSkills, getUnmetPrerequisites, type MiniPractice } from "@/lib/learning/catalog"
import { PythonRunner } from "@/components/learning/python-runner"

const pythonStarters: Record<string, { code: string; expected: string }> = {
  "welcome-card": { code: "name = \"小王\"\ngoal = \"学会 Python\"\nprint(f\"{name}，目标：{goal}\")", expected: "小王，目标：学会 Python" },
  "expense-calculator": { code: "quantity = 2\nprice = 18\nprint(quantity * price)", expected: "36" },
  "quality-classifier": { code: "def classify(score):\n    if score >= 80:\n        return \"合格\"\n    return \"复检\"\n\nprint(classify(90))", expected: "合格" },
  "delivery-reminder": { code: "orders = [2, 5, 1]\nfor days in orders:\n    if days < 3:\n        print(\"需要提醒\")", expected: "需要提醒" },
}

/** XMZADD 20260819 根据练习类型提供浏览器 Python 或本地 PyCharm 的实战工作台。 */
export function PracticeWorkbench({ practice }: { practice: MiniPractice }) {
  const [completed, setCompleted] = useState(false)
  const [accessGaps, setAccessGaps] = useState<string[]>([])
  const [accessLoading, setAccessLoading] = useState(true)
  const browserPractice = practice.category === "python"
  const starter = pythonStarters[practice.slug] ?? { code: `# ${practice.title}\nprint("完成：${practice.title}")`, expected: practice.title }

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
        if (!cancelled) setAccessGaps(getUnmetPrerequisites(practice.prerequisites, getCompletedSkills(completedLessons)))
      } catch {
        if (!cancelled) setAccessGaps(practice.prerequisites)
      } finally {
        if (!cancelled) setAccessLoading(false)
      }
    }

    loadAccess()
    return () => { cancelled = true }
  }, [practice])

  async function saveAttempt(code: string, output: string, passed: boolean) {
    try {
      await fetch("/api/learning/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content_type: "practice", content_slug: practice.slug, code, output, passed }) })
    } catch {
    }
  }

  async function markCompleted() {
    try {
      const response = await fetch("/api/learning/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content_type: "practice", content_slug: practice.slug, status: "completed" }) })
      if (!response.ok) throw new Error()
      setCompleted(true)
    } catch {
      setAccessGaps(practice.prerequisites)
    }
  }

  if (accessLoading) return <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">正在核对前置能力...</div>
  if (accessGaps.length > 0) return <div className="mx-auto max-w-3xl space-y-5"><Link href="/learning" prefetch={false} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回学习中心</Link><section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"><h1 className="text-lg font-semibold">该实战尚未解锁</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">请先完成：{accessGaps.join("、")}。完成课程和代码练习后，学习中心会自动把可开始的实战放到“现在开始做”。</p><Link href="/learning" prefetch={false} className="mt-5 inline-flex rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">返回继续学习</Link></section></div>

  return <div className="mx-auto max-w-5xl space-y-6"><Link href="/learning" prefetch={false} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回学习中心</Link><header className="border-b border-border pb-5"><p className="text-sm text-muted-foreground">能力包实战 · {practice.duration}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{practice.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{practice.summary}</p></header><section className="grid gap-5 md:grid-cols-3"><Info title="前置能力" text={practice.prerequisites.join("、")} /><Info title="完成交付物" text={practice.deliverable} /><Info title="验收方式" text="运行成功，解释自己的实现，再把错误和改进写进笔记。" /></section>{browserPractice ? <PythonRunner title={practice.title} starterCode={starter.code} expectedOutput={starter.expected} onRun={saveAttempt} onPassed={() => markCompleted()} /> : <section className="rounded-xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4" />在 PyCharm 中完成</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">这个练习已经涉及接口、SQL、大模型、RAG 或部署，不适合在浏览器沙盒里模拟。请在本地项目完成，并把实际运行结果放入后续企业项目证据中。</p><pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">{`python -m venv .venv\n.venv\\Scripts\\activate\npip install -r requirements.txt\npython main.py`}</pre><p className="mt-4 text-sm leading-6 text-muted-foreground">模型或企业接口密钥只能放在本地 <code className="rounded bg-secondary px-1 py-0.5">.env</code>。不要使用 <code className="rounded bg-secondary px-1 py-0.5">NEXT_PUBLIC_</code> 前缀，也不要把 Key 提交到仓库或上传到学习中心。</p><button type="button" onClick={markCompleted} className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"><CheckCircle2 className="h-4 w-4" />{completed ? "已记录本地实战完成" : "我已在本地完成实战"}</button></section>}<section className="rounded-xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><Code2 className="h-4 w-4" />从练习进入企业项目</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">这个小实战不计入毕业，但它负责让你立刻把刚学的技术变成可运行代码。完成后回到学习中心，系统会安排下一项能力或企业项目。</p><Link href="/learning/notes" prefetch={false} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">写下本次复盘</Link></section></div>
}

function Info({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>
}

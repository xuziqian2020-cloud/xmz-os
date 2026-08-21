"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  NotebookPen,
} from "lucide-react";
import type { LearningLesson } from "@/lib/learning/catalog";
import { sourceLinks } from "@/lib/learning/catalog";
import { PythonRunner } from "@/components/learning/python-runner";

const starters: Record<string, { code: string; expected: string }> = {
  "python-environment": {
    code: 'name = "学习者"\nprint(f"你好，{name}！")',
    expected: "你好，学习者！",
  },
  "python-values": {
    code: "quantity = 3\nprice = 12.5\ntotal = quantity * price\nprint(total)",
    expected: "37.5",
  },
  "python-branches": {
    code: 'score = 88\nif score >= 80:\n    print("合格")\nelse:\n    print("复检")',
    expected: "合格",
  },
  "python-functions": {
    code: "def is_risk(days):\n    return days < 3\n\nprint(is_risk(2))",
    expected: "True",
  },
};

/** XMZADD 20260819 将单节课程转为白话讲解、代码练习和完成记录的学习工作台。 */
export function LessonWorkspace({
  lesson,
  previousLesson,
  nextLesson,
}: {
  lesson: LearningLesson;
  previousLesson?: LearningLesson;
  nextLesson?: LearningLesson;
}) {
  const [completed, setCompleted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const starter = starters[lesson.slug] ?? {
    code: `# ${lesson.exercise}\nprint("我正在学习：${lesson.title}")`,
    expected: lesson.title,
  };

  async function completeLesson(code: string, output: string) {
    try {
      const attemptResponse = await fetch("/api/learning/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: "lesson", content_slug: lesson.slug, code, output, passed: true }),
      });
      if (!attemptResponse.ok) throw new Error();
      const response = await fetch("/api/learning/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: "lesson",
          content_slug: lesson.slug,
          status: "completed",
        }),
      });
      if (!response.ok) throw new Error();
      setCompleted(true);
      setSaveError("");
    } catch {
      setSaveError("学习进度未保存，请检查网络或数据库配置后重试。");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/learning"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回学习中心
      </Link>
      <header className="border-b border-border pb-5">
        <p className="text-sm text-muted-foreground">
          {lesson.duration} · 解锁能力：{lesson.skills.join("、")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {lesson.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {lesson.summary}
        </p>
      </header>
      {saveError && (
        <p
          role="alert"
          className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
        >
          {saveError}
        </p>
      )}
      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4" />
            先用白话理解
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            这一课的目标不是背语法，而是把一个现实问题拆成输入、处理规则和输出。先说清楚数据从哪里来、规则是什么、结果要给谁看，再让
            Python 逐步执行。
          </p>
          <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">本课任务：</span>
            {lesson.exercise}
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4" />
            遇到错误时这样排查
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>1. 先看报错最后一行，它通常最接近真正的问题。</li>
            <li>2. 检查变量名、冒号、缩进和字符串引号是否一致。</li>
            <li>
              3. 用{" "}
              <code className="rounded bg-secondary px-1 py-0.5">print()</code>{" "}
              观察中间数据，不要靠猜。
            </li>
            <li>4. 修正后重新运行，并把原因写进自己的笔记。</li>
          </ol>
        </article>
      </section>
      <PythonRunner
        title={lesson.exercise}
        starterCode={starter.code}
        expectedOutput={starter.expected}
        onPassed={(code, output) => completeLesson(code, output)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <NotebookPen className="h-4 w-4" />
          完成后用自己的话记录：这段代码解决了什么业务问题？
        </div>
        <div className="flex gap-3">
          <Link
            href="/learning/notes"
            prefetch={false}
            className="text-sm font-medium text-primary hover:underline"
          >
            写笔记
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            {completed ? "本课已完成" : "通过代码练习后自动完成"}
          </span>
        </div>
      </div>
      <nav aria-label="课程导航" className="grid gap-3 sm:grid-cols-2">
        {previousLesson ? (
          <Link
            href={`/learning/lessons/${previousLesson.slug}`}
            prefetch={false}
            className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">
                上一节
              </span>
              <span className="block truncate text-sm font-medium">
                {previousLesson.title}
              </span>
            </span>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/learning/lessons/${nextLesson.slug}`}
            prefetch={false}
            className="group flex min-w-0 items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/40 hover:bg-secondary/50"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">
                下一节
              </span>
              <span className="block truncate text-sm font-medium">
                {nextLesson.title}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">延伸阅读</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {sourceLinks.slice(0, 5).map((source) => (
            <a
              key={source.href}
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {source.title}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

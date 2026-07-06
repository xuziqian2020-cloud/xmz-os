"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import { signInOrSignUpWithPassword } from "@/lib/auth/password-login"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/supabase/demo"

export default function LoginPage() {
  const router = useRouter()
  const demoMode = isDemoMode()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [configError, setConfigError] = useState(false)

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError("")
    setNotice("")

    try {
      if (demoMode) {
        router.push("/dashboard")
        router.refresh()
        return
      }

      const supabase = createClient()
      const result = await signInOrSignUpWithPassword(supabase, email, password)

      if (result.ok) {
        setNotice(result.mode === "signed-up" ? "账号已创建，正在进入工作台。" : "登录成功，正在进入工作台。")
        router.push("/dashboard")
        router.refresh()
        return
      }

      setError(result.message)
    } catch (e: any) {
      if (e.message?.includes("Supabase 环境变量") || e.message?.includes("URL and API key")) {
        setConfigError(true)
      } else {
        setError(e.message || "登录失败，请稍后再试。")
      }
    } finally {
      setLoading(false)
    }
  }

  function handleEnterDemo() {
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[linear-gradient(135deg,hsl(220_30%_98%),hsl(214_28%_94%))] text-foreground dark:bg-[linear-gradient(135deg,hsl(222_24%_7%),hsl(220_22%_11%))]">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative flex min-h-[44rem] flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <div className="absolute inset-0 -z-0 bg-[linear-gradient(hsl(var(--foreground)/0.045)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background shadow-sm">
                XMZ
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">XMZ OS</p>
                <p className="text-xs text-muted-foreground">个人研发工作 OS</p>
              </div>
            </div>
            <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
              {demoMode ? "演示模式" : "Supabase 已接入"}
            </span>
          </div>

          <div className="relative z-10 max-w-2xl py-16 lg:py-24">
            <p className="mb-5 inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              研发计划、知识库、任务与复盘放在一个工作区
            </p>
            <h1 className="max-w-[10em] text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              <span className="block">你的研发工作</span>
              <span className="block">从这里开始。</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              用邮箱和密码进入。第一次使用会自动创建账号，之后只校验邮箱和密码。
            </p>
          </div>

          <div className="relative z-10 grid gap-3 pb-6 sm:grid-cols-3">
            {[
              ["计划", "拆分目标与下一步动作"],
              ["知识", "沉淀项目资料和经验"],
              ["复盘", "跟踪问题、文件与报告"],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-border bg-background/72 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center px-6 pb-10 sm:px-10 lg:px-12 lg:py-12">
          <div className="w-full rounded-lg border border-border bg-card/92 p-5 shadow-[0_28px_90px_hsl(220_28%_22%/0.16)] backdrop-blur xl:p-7">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">登录工作台</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">邮箱和密码登录</h2>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
                <LockKeyhole className="h-5 w-5" />
              </div>
            </div>

            {demoMode && (
              <div className="mb-5 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/80 dark:bg-amber-950/50 dark:text-amber-100">
                当前是演示模式。配置 Supabase 后会启用真实账号登录。
              </div>
            )}

            {configError && (
              <div className="mb-5 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                未配置 Supabase 环境变量。请检查 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  邮箱地址
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-accent focus:ring-2 focus:ring-accent/18"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  登录密码
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位密码"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-accent focus:ring-2 focus:ring-accent/18"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                  {error}
                </p>
              )}

              {notice && (
                <p className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-sm leading-6 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition-all hover:translate-y-[-1px] hover:opacity-95 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
              >
                {loading ? "正在处理" : demoMode ? "进入演示工作台" : "登录或首次注册"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {demoMode && (
              <button
                type="button"
                onClick={handleEnterDemo}
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                不填账号，直接预览
              </button>
            )}

            <div className="mt-7 border-t border-border pt-5">
              <p className="text-xs leading-5 text-muted-foreground">
                首次登录会自动注册。再次登录时，如果邮箱已存在，系统只接受匹配的密码。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

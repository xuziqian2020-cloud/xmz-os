"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/supabase/demo"

export default function LoginPage() {
  const router = useRouter()
  const demoMode = isDemoMode()

  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [configError, setConfigError] = useState(false)

  const handleSendCode = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError("")

    try {
      if (demoMode) {
        router.push("/dashboard")
        router.refresh()
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setStep("code")
      }
    } catch (e: any) {
      if (e.message?.includes("URL and API key")) {
        setConfigError(true)
      } else {
        setError(e.message)
      }
    }
    setLoading(false)
  }

  const handleEnterDemo = () => {
    router.push("/dashboard")
    router.refresh()
  }

  const handleVerify = async () => {
    if (!code.trim() || code.length < 6) return
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (e: any) {
      if (e.message?.includes("URL and API key")) {
        setConfigError(true)
      } else {
        setError(e.message)
      }
    }
    setLoading(false)
  }

  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">XMZ OS</h1>
            <p className="mt-2 text-sm text-muted-foreground">个人研发工作 OS</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              未配置 Supabase 环境变量
            </p>
            <p className="text-xs text-muted-foreground">
              创建 <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">.env.local</code> 并填入
              <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code>
              和
              <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">XMZ OS</h1>
          <p className="mt-2 text-sm text-muted-foreground">个人研发工作 OS</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {demoMode && (
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              当前是演示模式：可直接进入工作台预览界面；正式登录需要配置真实 Supabase。
            </div>
          )}
          {step === "email" ? (
            <>
              <h2 className="mb-1 text-sm font-medium">登录或注册</h2>
              <p className="mb-6 text-xs text-muted-foreground">
                {demoMode ? "当前未连接真实 Supabase，可先查看演示效果" : "输入邮箱，首次登录将自动创建账号"}
              </p>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                />
              </div>
              {error && (
                <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              <button
                onClick={handleSendCode}
                disabled={!email.trim() || loading}
                className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "处理中..." : demoMode ? "输入邮箱并进入演示" : "发送验证码"}
              </button>
              {demoMode && (
                <button
                  onClick={handleEnterDemo}
                  className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/60"
                >
                  直接进入演示工作台
                </button>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-1 text-sm font-medium">输入验证码</h2>
              <p className="mb-6 text-xs text-muted-foreground">
                验证码已发送至 {email}
                <button onClick={() => setStep("email")} className="ml-1 text-primary hover:underline">
                  修改
                </button>
              </p>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  验证码
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-lg tracking-widest outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              {error && (
                <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              <button
                onClick={handleVerify}
                disabled={code.length < 6 || loading}
                className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "验证中..." : "验证并登录"}
              </button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                没有收到？
                <button onClick={handleSendCode} className="ml-1 text-primary hover:underline">
                  重新发送
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          登录即表示你同意使用此个人工具系统
        </p>
      </div>
    </div>
  )
}

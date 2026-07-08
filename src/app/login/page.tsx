"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import {
  ADMIN_REMEMBER_FLAG,
  REMEMBER_CREDENTIALS_KEY,
  isAdminLoginName,
  normalizeLoginName,
} from "@/lib/auth/local-admin"
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
  const [rememberPassword, setRememberPassword] = useState(false)

  const isXiaomeiLogin = isAdminLoginName(email)
  const canSubmit = email.trim().length > 0 && (isXiaomeiLogin || password.length >= 6) && !loading

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_CREDENTIALS_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved) as { email?: string; password?: string }
      if (parsed.email) setEmail(parsed.email)
      if (parsed.password) setPassword(parsed.password)
      setRememberPassword(true)
    } catch {
      window.localStorage.removeItem(REMEMBER_CREDENTIALS_KEY)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError("")
    setNotice("")

    try {
      if (isXiaomeiLogin) {
        const res = await fetch("/api/auth/admin-login", { method: "POST" })
        const data = await res.json()

        if (!res.ok || !data.ok) {
          setError(data.error || "徐小美免密登录失败，请检查配置。")
          return
        }

        window.localStorage.setItem(ADMIN_REMEMBER_FLAG, "1")
        window.localStorage.removeItem(REMEMBER_CREDENTIALS_KEY)
        setNotice("徐小美免密登录成功，正在进入工作台。")
        router.push("/dashboard")
        router.refresh()
        return
      }

      if (demoMode) {
        router.push("/dashboard")
        router.refresh()
        return
      }

      const supabase = createClient()
      const normalizedEmail = normalizeLoginName(email)
      const result = await signInOrSignUpWithPassword(supabase, normalizedEmail, password)

      if (result.ok) {
        if (rememberPassword) {
          window.localStorage.setItem(
            REMEMBER_CREDENTIALS_KEY,
            JSON.stringify({ email: normalizedEmail, password })
          )
        } else {
          window.localStorage.removeItem(REMEMBER_CREDENTIALS_KEY)
        }
        window.localStorage.removeItem(ADMIN_REMEMBER_FLAG)
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

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <section className="w-full max-w-[440px]">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-base font-bold text-slate-950">
            小美
          </div>
          <div>
            <p className="text-xl font-semibold">XMZ OS</p>
            <p className="text-base text-slate-400">个人研发工作台</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-300">登录工作台</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">进入 XMZ OS</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <LockKeyhole className="h-6 w-6" />
            </div>
          </div>

          {demoMode && (
            <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              当前是演示模式。普通账号可直接进入预览，徐小美仍使用免密入口。
            </div>
          )}

          {configError && (
            <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              未配置 Supabase 环境变量，请检查 URL 和 ANON KEY。
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-base font-medium text-slate-200">
                <Mail className="h-5 w-5 text-slate-400" />
                邮箱账号
              </span>
              <input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="输入邮箱，或输入徐小美免密登录"
                autoComplete="username"
                className="h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-lg text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            {!isXiaomeiLogin && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-base font-medium text-slate-200">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                  登录密码
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 6 位密码"
                  autoComplete="current-password"
                  className="h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-lg text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
            )}

            {!isXiaomeiLogin && (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-slate-200">记住密码</span>
                  <span className="mt-0.5 block text-xs text-slate-500">仅保存在当前浏览器</span>
                </span>
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(event) => setRememberPassword(event.target.checked)}
                  className="h-5 w-5 rounded accent-emerald-500"
                />
              </label>
            )}

            {isXiaomeiLogin && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
                已识别为徐小美账号，可以直接登录。
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {notice && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-300 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? "正在处理..." : isXiaomeiLogin ? "徐小美免密登录" : demoMode ? "进入演示工作台" : "登录或首次注册"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

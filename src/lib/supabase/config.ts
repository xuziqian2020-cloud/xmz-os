const PLACEHOLDER_MARKS = ["placeholder", "your-supabase-url", "your-anon-key"]

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isPlaceholderValue(value: string | undefined): boolean {
  if (!hasValue(value)) return true
  const normalized = value.trim().toLowerCase()
  return PLACEHOLDER_MARKS.some((mark) => normalized.includes(mark))
}

function isValidUrl(value: string | undefined): boolean {
  if (!hasValue(value)) return false

  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 占位配置只服务本地预览，不能触发真实登录请求。
  return isValidUrl(url) && !isPlaceholderValue(url) && !isPlaceholderValue(key)
}

export function isDemoMode(): boolean {
  return !isSupabaseReady()
}

export function getSupabaseConfigError(): string {
  return "未配置真实 Supabase 环境变量：NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY"
}

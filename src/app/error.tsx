"use client"

// 全局错误边界
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold">应用出现错误</h1>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {error.message || "发生了意外错误，请刷新页面重试。"}
          </p>
          <button
            onClick={reset}
            className="mt-8 rounded-md bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            刷新页面
          </button>
        </div>
      </body>
    </html>
  )
}

"use client"

import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-lg font-semibold">加载失败</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        无法加载工作台数据，请检查网络连接后重试。
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        重新加载
      </button>
    </div>
  )
}

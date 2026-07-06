"use client"

import { AlertTriangle } from "lucide-react"

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error
  reset?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold">出错了</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        {error.message || "发生了一个意外错误，请稍后重试。"}
      </p>
      {reset && (
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          重试
        </button>
      )}
    </div>
  )
}

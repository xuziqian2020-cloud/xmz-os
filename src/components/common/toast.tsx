"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, durationMs?: number) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string, durationMs = 4000) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), durationMs)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismiss }}>
      {children}
      {/* Toast 渲染区 */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all animate-in slide-in-from-right ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                  : "border-border bg-card text-foreground"
            }`}
          >
            <span className="shrink-0 text-xs">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

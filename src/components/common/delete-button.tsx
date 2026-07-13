"use client"

import type { MouseEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function DeleteButton({
  endpoint,
  confirmText,
  label = "删除",
  className,
  onDeleted,
}: {
  endpoint: string
  confirmText: string
  label?: string
  className?: string
  onDeleted?: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (deleting) return
    if (!window.confirm(confirmText)) return

    setDeleting(true)
    try {
      const res = await fetch(endpoint, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "删除失败")
      if (onDeleted) {
        onDeleted()
      } else {
        router.refresh()
      }
    } catch (e: any) {
      window.alert(e.message || "删除失败")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
        className
      )}
      aria-label={label}
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span>{deleting ? "删除中" : label}</span>
    </button>
  )
}

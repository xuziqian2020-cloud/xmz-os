"use client"

import { Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function BulkActionBar({
  selectedCount,
  visibleCount,
  allSelected,
  deleting = false,
  onToggleAll,
  onClear,
  onDelete,
  children,
}: {
  selectedCount: number
  visibleCount: number
  allSelected: boolean
  deleting?: boolean
  onToggleAll: () => void
  onClear: () => void
  onDelete: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            disabled={visibleCount === 0}
            className="h-4 w-4 rounded border-border"
          />
          <span>全选</span>
        </label>
        <span className="text-sm text-muted-foreground">已选择 {selectedCount} 项</span>
        {selectedCount > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-primary hover:underline">
            清空选择
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          onClick={onDelete}
          disabled={selectedCount === 0 || deleting}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "删除中..." : "批量删除"}
        </button>
      </div>
    </div>
  )
}

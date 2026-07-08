"use client"

import { useMemo, useState } from "react"
import { getAllowedStatuses, normalizeStatusForType } from "@/lib/work-plans/status-rules"

type PlanStatusSelectProps = {
  planId: string
  type?: string | null
  status?: string | null
  progress?: number | null
}

export function PlanStatusSelect({ planId, type, status, progress }: PlanStatusSelectProps) {
  const normalized = useMemo(
    () => normalizeStatusForType({ type, status, progress }),
    [type, status, progress]
  )
  const [value, setValue] = useState(normalized.status)
  const [saving, setSaving] = useState(false)

  async function handleChange(nextStatus: string) {
    const next = normalizeStatusForType({ type, status: nextStatus, progress })
    setValue(next.status)
    setSaving(true)

    try {
      await fetch(`/api/work-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.status, progress: next.progress }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      aria-label="快捷修改计划状态"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      disabled={saving}
      className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none transition-colors hover:border-[hsl(var(--accent)/0.45)] focus:border-[hsl(var(--accent)/0.65)] disabled:opacity-50"
    >
      {getAllowedStatuses(type).map((item) => (
        <option key={item} value={item}>{item}</option>
      ))}
    </select>
  )
}

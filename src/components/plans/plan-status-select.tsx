"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getAllowedStatuses,
  normalizePriority,
  normalizeStatusForType,
  priorityToLabel,
} from "@/lib/work-plans/status-rules"

type PlanControlProps = {
  planId: string
  type?: string | null
  status?: string | null
  priority?: string | null
  progress?: number | null
  onSaved?: (plan: any) => void
}

const priorities = ["high", "medium", "low"] as const

export function PlanPrioritySelect({ planId, type, priority, onSaved }: PlanControlProps) {
  const router = useRouter()
  const [value, setValue] = useState(normalizePriority(priority))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(normalizePriority(priority))
  }, [priority])

  async function handleChange(nextPriority: string) {
    const previous = value
    const normalized = normalizePriority(nextPriority)
    setValue(normalized)
    setSaving(true)

    try {
      const body: Record<string, string> = { priority: normalized }
      if (type === "bug") body.bug_severity = normalized

      const res = await fetch(`/api/work-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        onSaved?.(data)
        if (!onSaved) router.refresh()
      } else {
        setValue(previous)
      }
    } catch {
      setValue(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      aria-label="修改计划重要程度"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      disabled={saving}
      className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none transition-colors hover:border-[hsl(var(--accent)/0.45)] focus:border-[hsl(var(--accent)/0.65)] disabled:opacity-50"
    >
      {priorities.map((item) => (
        <option key={item} value={item}>{priorityToLabel(item)}</option>
      ))}
    </select>
  )
}

export function PlanCompletionSelect({ planId, type, status, progress, onSaved }: PlanControlProps) {
  const router = useRouter()
  const normalized = useMemo(
    () => normalizeStatusForType({ type, status, progress }),
    [type, status, progress]
  )
  const [value, setValue] = useState(normalized.status)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(normalized.status)
  }, [normalized.status])

  async function handleChange(nextStatus: string) {
    const previous = value
    const next = normalizeStatusForType({ type, status: nextStatus, progress })
    const nextProgress = next.status === "进行中" ? 0 : next.progress
    setValue(next.status)
    setSaving(true)

    try {
      const res = await fetch(`/api/work-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next.status,
          progress: nextProgress,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        onSaved?.(data)
        if (!onSaved) router.refresh()
      } else {
        setValue(previous)
      }
    } catch {
      setValue(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      aria-label="修改计划完成状态"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      disabled={saving}
      className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none transition-colors hover:border-[hsl(var(--accent)/0.45)] focus:border-[hsl(var(--accent)/0.65)] disabled:opacity-50"
    >
      {getAllowedStatuses(type).map((item) => (
        <option key={item} value={item}>{item}</option>
      ))}
    </select>
  )
}

export function PlanStatusSelect(props: PlanControlProps) {
  return <PlanCompletionSelect {...props} />
}

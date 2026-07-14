"use client"

import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type UserProfile = {
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  department?: string | null
  role_title?: string | null
}

export function UserProfileButton({
  fallbackName = "开发者",
  fallbackAvatar = "/images/xiaomei-avatar.png",
  showText = false,
  className,
}: {
  fallbackName?: string
  fallbackAvatar?: string
  showText?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    display_name: fallbackName,
    avatar_url: fallbackAvatar,
    bio: "",
    department: "",
    role_title: "",
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return
        setProfile({
          display_name: data.display_name || fallbackName,
          avatar_url: data.avatar_url || fallbackAvatar,
          bio: data.bio || "",
          department: data.department || "",
          role_title: data.role_title || "",
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [fallbackAvatar, fallbackName])

  function updateField(field: keyof UserProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件作为头像。")
      return
    }
    if (file.size > 1024 * 1024) {
      setError("头像图片请控制在 1MB 以内。")
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error("头像读取失败"))
      reader.readAsDataURL(file)
    })
    updateField("avatar_url", dataUrl)
    setError("")
  }

  async function saveProfile() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "保存个人信息失败")
      setProfile(data)
      setOpen(false)
    } catch (e: any) {
      setError(e.message || "保存个人信息失败")
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  const displayName = profile.display_name || fallbackName
  const avatar = profile.avatar_url || fallbackAvatar

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("flex min-w-0 items-center gap-3 rounded-lg text-left transition-colors hover:bg-secondary/60", className)}
        title="更改头像和个人信息"
      >
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-background">
          <img src={avatar} alt="个人头像" className="h-full w-full object-cover" />
        </span>
        {showText && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{profile.role_title || "个人工作台"}</span>
          </span>
        )}
      </button>

      {open && (
        <div data-testid="profile-modal-backdrop" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-xl font-semibold">个人信息</h2>
                <p className="mt-1 text-sm text-muted-foreground">更改头像、名字和常用个人资料</p>
              </div>
              <button type="button" aria-label="关闭个人信息" onClick={() => setOpen(false)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center gap-4">
                <span className="h-16 w-16 overflow-hidden rounded-full border border-border bg-background">
                  <img src={avatar} alt="个人头像预览" className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <label className="text-sm font-medium">更改头像</label>
                  <input
                    value={profile.avatar_url || ""}
                    onChange={(event) => updateField("avatar_url", event.target.value)}
                    placeholder="头像 URL，或选择本地图片"
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                  />
                  <input type="file" accept="image/*" onChange={handleAvatarFile} className="mt-2 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-background" />
                </div>
              </div>

              <ProfileField label="名字" value={profile.display_name || ""} onChange={(value) => updateField("display_name", value)} />
              <ProfileField label="部门" value={profile.department || ""} onChange={(value) => updateField("department", value)} />
              <ProfileField label="岗位" value={profile.role_title || ""} onChange={(value) => updateField("role_title", value)} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">其他个人信息</label>
                <textarea
                  value={profile.bio || ""}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-border p-5">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">取消</button>
              <button type="button" onClick={saveProfile} disabled={saving || loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40">
                {saving ? "保存中..." : "保存个人信息"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ProfileField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
      />
    </div>
  )
}

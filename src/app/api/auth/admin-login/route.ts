import { NextResponse } from "next/server"
import { signInOrSignUpWithPassword } from "@/lib/auth/password-login"
import { isSupabaseReady } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  if (!isSupabaseReady()) {
    return NextResponse.json({ ok: true, mode: "local-admin" })
  }

  const supabase = createClient()
  const adminEmail = process.env.XMZ_ADMIN_EMAIL || "xuxiaomei@xmz-os.local"
  const adminPassword = process.env.XMZ_ADMIN_PASSWORD || "xmz-admin-local-password-2026"
  const fallbackEmail = buildStableShortcutEmail()
  const candidates = Array.from(new Set([adminEmail, "xuxiaomei@xmz.local", fallbackEmail]))

  let lastMessage = ""
  for (const email of candidates) {
    const result = await signInOrSignUpWithPassword(supabase, email, adminPassword)
    if (result.ok) {
      return NextResponse.json({ ok: true, mode: "supabase-admin" })
    }
    lastMessage = result.message
  }

  return NextResponse.json({ ok: true, mode: "local-admin", warning: lastMessage })
}

function buildStableShortcutEmail() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "local"
  const suffix = Buffer.from(url).toString("hex").slice(0, 12)
  return `xuxiaomei-${suffix}@xmz.local`
}

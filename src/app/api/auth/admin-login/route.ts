import { NextResponse } from "next/server"
import { signInOrSignUpWithPassword } from "@/lib/auth/password-login"
import { isSupabaseReady } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  if (!isSupabaseReady()) {
    return NextResponse.json({ ok: true, mode: "local-admin" })
  }

  const supabase = createClient()
  const adminEmail = process.env.XMZ_ADMIN_EMAIL || "admin@xmz.local"
  const adminPassword = process.env.XMZ_ADMIN_PASSWORD || "xmz-admin-local-password-2026"
  const result = await signInOrSignUpWithPassword(supabase, adminEmail, adminPassword)

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, mode: "supabase-admin" })
}

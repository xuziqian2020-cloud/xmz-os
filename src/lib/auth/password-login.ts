type AuthError = { message?: string } | null
type AuthData = { session?: unknown | null } | null

export type PasswordAuthClient = {
  auth: {
    signInWithPassword(params: { email: string; password: string }): Promise<{ data: AuthData; error: AuthError }>
    signUp(params: { email: string; password: string }): Promise<{ data: AuthData; error: AuthError }>
  }
}

export type PasswordAuthResult =
  | { ok: true; mode: "signed-in" | "signed-up" }
  | { ok: false; reason: "invalid-credentials" | "email-confirmation-required" | "auth-error"; message: string }

function isExistingUserError(message: string): boolean {
  const normalized = message.toLowerCase()
  return normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")
}

export async function signInOrSignUpWithPassword(
  client: PasswordAuthClient,
  email: string,
  password: string
): Promise<PasswordAuthResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const signInResult = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (!signInResult.error) {
    return { ok: true, mode: "signed-in" }
  }

  const signUpResult = await client.auth.signUp({
    email: normalizedEmail,
    password,
  })

  if (signUpResult.error) {
    if (isExistingUserError(signUpResult.error.message || "")) {
      return {
        ok: false,
        reason: "invalid-credentials",
        message: "这个邮箱已经注册过，请检查密码是否正确。",
      }
    }

    return {
      ok: false,
      reason: "auth-error",
      message: signUpResult.error.message || "登录失败，请稍后再试。",
    }
  }

  if (signUpResult.data?.session) {
    return { ok: true, mode: "signed-up" }
  }

  return {
    ok: false,
    reason: "email-confirmation-required",
    message: "账号已创建，但 Supabase 仍要求邮箱确认。请在 Supabase Auth 设置里关闭 Confirm email。",
  }
}

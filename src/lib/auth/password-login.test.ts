import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { signInOrSignUpWithPassword } from "./password-login"

function createAuthClient({
  signInError,
  signUpError,
  signInSession = null,
  signUpSession = null,
}: {
  signInError?: string
  signUpError?: string
  signInSession?: object | null
  signUpSession?: object | null
}) {
  const calls: string[] = []

  return {
    calls,
    client: {
      auth: {
        async signInWithPassword() {
          calls.push("signInWithPassword")
          return {
            data: { session: signInSession },
            error: signInError ? { message: signInError } : null,
          }
        },
        async signUp() {
          calls.push("signUp")
          return {
            data: { session: signUpSession },
            error: signUpError ? { message: signUpError } : null,
          }
        },
      },
    },
  }
}

describe("signInOrSignUpWithPassword", () => {
  it("logs in existing users without creating a new account", async () => {
    const { client, calls } = createAuthClient({
      signInSession: { access_token: "session" },
    })

    const result = await signInOrSignUpWithPassword(client, "User@Example.com ", "pass123456")

    assert.deepEqual(calls, ["signInWithPassword"])
    assert.equal(result.ok, true)
    assert.equal(result.mode, "signed-in")
  })

  it("creates and logs in first-time users with email and password", async () => {
    const { client, calls } = createAuthClient({
      signInError: "Invalid login credentials",
      signUpSession: { access_token: "new-session" },
    })

    const result = await signInOrSignUpWithPassword(client, "new@example.com", "pass123456")

    assert.deepEqual(calls, ["signInWithPassword", "signUp"])
    assert.equal(result.ok, true)
    assert.equal(result.mode, "signed-up")
  })

  it("reports a password mismatch when the email already exists", async () => {
    const { client } = createAuthClient({
      signInError: "Invalid login credentials",
      signUpError: "User already registered",
    })

    const result = await signInOrSignUpWithPassword(client, "old@example.com", "wrongpass")

    assert.equal(result.ok, false)
    assert.equal(result.reason, "invalid-credentials")
  })

  it("reports Supabase email confirmation when sign-up does not return a session", async () => {
    const { client } = createAuthClient({
      signInError: "Invalid login credentials",
      signUpSession: null,
    })

    const result = await signInOrSignUpWithPassword(client, "first@example.com", "pass123456")

    assert.equal(result.ok, false)
    assert.equal(result.reason, "email-confirmation-required")
  })
})

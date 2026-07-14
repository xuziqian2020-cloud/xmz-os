import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("user profile persistence", () => {
  it("adds a Supabase profile table for avatar and personal information", () => {
    const source = readFileSync("supabase/migrations/002_user_profiles.sql", "utf8")

    assert.match(source, /CREATE TABLE IF NOT EXISTS user_profiles/)
    assert.match(source, /display_name\s+TEXT/)
    assert.match(source, /avatar_url\s+TEXT/)
    assert.match(source, /department\s+TEXT/)
    assert.match(source, /role_title\s+TEXT/)
    assert.match(source, /ENABLE ROW LEVEL SECURITY/)
  })

  it("exposes GET and PUT profile APIs", () => {
    const source = readFileSync("src/app/api/profile/route.ts", "utf8")

    assert.match(source, /export async function GET/)
    assert.match(source, /export async function PUT/)
    assert.match(source, /from\("user_profiles"\)/)
    assert.match(source, /display_name/)
    assert.match(source, /avatar_url/)
  })

  it("renders a shared clickable avatar profile editor", () => {
    const source = readFileSync("src/components/profile/user-profile-button.tsx", "utf8")

    assert.match(source, /export function UserProfileButton/)
    assert.match(source, /onClick=\{\(\) => setOpen\(true\)\}/)
    assert.match(source, /更改头像/)
    assert.match(source, /保存个人信息/)
    assert.match(source, /\/api\/profile/)
  })
})

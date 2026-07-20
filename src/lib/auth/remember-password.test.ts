import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8")
}

describe("remember password login", () => {
  it("does not show the browser-only storage hint on the login form", () => {
    const loginPage = source("../../app/login/page.tsx")

    assert.match(loginPage, /记住密码/)
    assert.equal(loginPage.includes("仅保存在当前浏览器"), false)
  })

  it("keeps remembered credentials when users log out", () => {
    const sidebar = source("../../components/layout/sidebar.tsx")
    const logoutStart = sidebar.indexOf("async function handleLogout")
    const logoutEnd = sidebar.indexOf("return (", logoutStart)
    const logoutSource = sidebar.slice(logoutStart, logoutEnd)

    assert.match(logoutSource, /removeItem\(ADMIN_REMEMBER_FLAG\)/)
    assert.equal(logoutSource.includes("REMEMBER_CREDENTIALS_KEY"), false)
  })
})

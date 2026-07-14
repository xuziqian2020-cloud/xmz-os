import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildLocalAdminHeaders, isAdminLoginName, normalizeLoginName } from "./local-admin"

describe("local admin login helpers", () => {
  it("只允许徐小美触发免密入口", () => {
    assert.equal(isAdminLoginName("徐小美"), true)
    assert.equal(isAdminLoginName(" 徐小美 "), true)
    assert.equal(isAdminLoginName("admin"), false)
    assert.equal(isAdminLoginName("ADMIN"), false)
  })

  it("普通邮箱不会触发免密入口", () => {
    assert.equal(isAdminLoginName("admin@example.com"), false)
    assert.equal(isAdminLoginName("xuxiaomei@example.com"), false)
  })

  it("普通登录名保持邮箱小写规范化", () => {
    assert.equal(normalizeLoginName(" User@Example.com "), "user@example.com")
  })

  it("本地管理员请求会带明确的接口读取标识", () => {
    assert.deepEqual(buildLocalAdminHeaders(true), { "x-xmz-local-admin": "1" })
    assert.deepEqual(buildLocalAdminHeaders(false), {})
  })
})

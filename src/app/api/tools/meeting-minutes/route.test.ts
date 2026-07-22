import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("会议纪要接口", () => {
  it("服务端只允许本地会议纪要供应商", () => {
    const route = readFileSync(new URL("./route.ts", import.meta.url), "utf8")
    const serverProvider = readFileSync(new URL("../../../../lib/ai/server-provider.ts", import.meta.url), "utf8")

    assert.match(route, /resolveServerProvider\(body\.provider \|\| null, "meeting_minutes"\)/)
    assert.doesNotMatch(serverProvider, /\.limit\(5\)/)
  })
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("assistant chat command UI", () => {
  it("keeps assistant commands collapsed by default on the main assistant page", () => {
    const source = readFileSync("src/app/ai-secretary/page.tsx", "utf8")

    assert.match(source, /const \[commandsOpen, setCommandsOpen\] = useState\(false\)/)
    assert.match(source, /setCommandsOpen\(\(open\) => !open\)/)
    assert.match(source, /指令/)
    assert.match(source, /onClick=\{\(\) => setChatInput\(suggestion\.prompt\)\}/)
    assert.doesNotMatch(source, /onClick=\{\(\) => handleChatSubmit\(suggestion\.prompt\)\}/)
    assert.match(source, /\/api\/assistant\/query\?text=/)
    assert.match(source, /headers: buildLocalAdminHeaders\(isRememberedAdmin\(\)\)/)
    assert.match(source, /formatQueryFailure\(data, command\.label\)/)
  })

  it("keeps dashboard chat commands collapsed and fills the input instead of sending", () => {
    const source = readFileSync("src/components/dashboard/dashboard-client.tsx", "utf8")

    assert.match(source, /const \[commandsOpen, setCommandsOpen\] = useState\(false\)/)
    assert.match(source, /onClick=\{\(\) => onInputChange\(item\.prompt\)\}/)
    assert.doesNotMatch(source, /onClick=\{\(\) => onSubmit\(undefined, item\.prompt\)\}/)
    assert.match(source, /\/api\/assistant\/query\?text=/)
    assert.match(source, /headers: buildLocalAdminHeaders\(isRememberedAdmin\(\)\)/)
    assert.match(source, /formatQueryFailure\(data, command\.label\)/)
  })
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("multi file upload entry points", () => {
  it("files page allows selecting multiple files and uploads every selected file", () => {
    const source = readFileSync("src/app/files/page.tsx", "utf8")

    assert.match(source, /type="file"[\s\S]*?multiple/)
    assert.match(source, /Array\.from\(e\.target\.files/)
    assert.match(source, /for \(const file of fileList\)/)
    assert.match(source, /已上传 \${successCount} 个文件/)
  })

  it("knowledge import keeps the multi-select document import path for knowledge and experiences", () => {
    const source = readFileSync("src/app/knowledge/new/page.tsx", "utf8")

    assert.match(source, /async function handleImportFiles/)
    assert.match(source, /type="file"[\s\S]*?multiple/)
    assert.match(source, /fromExperience \? "经验库" : "技术文档"/)
  })

  it("experience page exposes a direct batch import affordance", () => {
    const source = readFileSync("src/app/experiences/page.tsx", "utf8")

    assert.match(source, /批量导入经验/)
    assert.match(source, /category=\$\{encodeURIComponent\(EXPERIENCE_CATEGORY\)\}/)
  })
})

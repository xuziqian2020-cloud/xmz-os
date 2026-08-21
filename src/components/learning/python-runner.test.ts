import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("learning Python runner", () => {
  it("loads Pyodide inside a worker and blocks network, file, and package operations", () => {
    const worker = readFileSync("public/learning/python-runner.js", "utf8")
    const runner = readFileSync("src/components/learning/python-runner.tsx", "utf8")

    assert.match(worker, /importScripts/)
    assert.match(worker, /loadPyodide/)
    assert.match(worker, /blockedPatterns/)
    assert.match(worker, /网络、文件和安装第三方包/)
    assert.match(worker, /postMessage/)
    assert.match(worker, /type: "ready"/)
    assert.match(worker, /ready/)
    assert.match(worker, /js\|socket/)
    assert.match(worker, /builtins\.__import__ = _learning_blocked/)
    assert.match(runner, /event\.data\.type === "ready"/)
    assert.match(runner, /}, 20000\)/)
    assert.match(runner, /}, 4000\)/)
  })

  it("serves Pyodide locally so browser practice does not depend on a third-party CDN", () => {
    const worker = readFileSync("public/learning/python-runner.js", "utf8")
    const copyScript = readFileSync("scripts/copy-pyodide-assets.mjs", "utf8")

    assert.match(worker, /const indexURL = "\/learning\/pyodide\/"/)
    assert.doesNotMatch(worker, /https:\/\/cdn\.jsdelivr/)
    assert.match(copyScript, /"node_modules", "pyodide"/)
    assert.match(copyScript, /"public", "learning", "pyodide"/)
  })

  it("renders browser practice separately from PyCharm project practice", () => {
    const runner = readFileSync("src/components/learning/python-runner.tsx", "utf8")
    const practice = readFileSync("src/components/learning/practice-workbench.tsx", "utf8")
    const lesson = readFileSync("src/components/learning/lesson-workspace.tsx", "utf8")

    assert.match(runner, /new Worker\("\/learning\/python-runner\.js"\)/)
    assert.match(runner, /代码会在浏览器本地运行/)
    assert.match(practice, /在 PyCharm 中完成/)
    assert.match(practice, /NEXT_PUBLIC_/)
    assert.match(lesson, /PythonRunner/)
    assert.match(runner, /写代码练习/)
  })
})

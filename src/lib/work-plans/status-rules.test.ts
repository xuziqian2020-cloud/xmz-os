import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getAllowedStatuses, normalizeStatusForType } from "./status-rules"

describe("work plan visible status rules", () => {
  it("需求、Bug 和自定义计划都只展示三个重要程度", () => {
    assert.deepEqual(getAllowedStatuses("requirement"), ["重要", "中等", "低"])
    assert.deepEqual(getAllowedStatuses("bug"), ["重要", "中等", "低"])
    assert.deepEqual(getAllowedStatuses("custom"), ["重要", "中等", "低"])
  })

  it("不支持的状态会回到中等，避免页面状态过多", () => {
    assert.deepEqual(normalizeStatusForType({ type: "bug", status: "处理中", progress: 88 }), {
      status: "中等",
      progress: 88,
    })
  })

  it("计划进度会限制在 0 到 100", () => {
    assert.deepEqual(normalizeStatusForType({ type: "requirement", status: "重要", progress: 140 }), {
      status: "重要",
      progress: 100,
    })
  })
})

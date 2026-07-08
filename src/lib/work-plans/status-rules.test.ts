import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getAllowedStatuses, normalizeStatusForType } from "./status-rules"

describe("work plan status rules", () => {
  it("limits bug statuses to the approved three states", () => {
    assert.deepEqual(getAllowedStatuses("bug"), ["待分析", "无法重现", "已修复"])
  })

  it("sets bug progress from status", () => {
    assert.deepEqual(normalizeStatusForType({ type: "bug", status: "待分析", progress: 88 }), {
      status: "待分析",
      progress: 0,
    })
    assert.deepEqual(normalizeStatusForType({ type: "bug", status: "无法重现" }), {
      status: "无法重现",
      progress: 0,
    })
    assert.deepEqual(normalizeStatusForType({ type: "bug", status: "已修复" }), {
      status: "已修复",
      progress: 100,
    })
  })

  it("falls back to pending analysis for unsupported bug statuses", () => {
    assert.deepEqual(normalizeStatusForType({ type: "bug", status: "处理中", progress: 50 }), {
      status: "待分析",
      progress: 0,
    })
  })

  it("keeps normal plan progress bounded", () => {
    assert.deepEqual(normalizeStatusForType({ type: "requirement", status: "开发中", progress: 140 }), {
      status: "开发中",
      progress: 100,
    })
  })
})

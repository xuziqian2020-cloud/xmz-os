import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getAllowedStatuses, normalizeStatusForType, priorityToLabel, statusToPriority } from "./status-rules"

describe("work plan visible status rules", () => {
  it("需求、Bug 和自定义计划都只展示三个完成状态", () => {
    assert.deepEqual(getAllowedStatuses("requirement"), ["进行中", "已完成", "已拒绝"])
    assert.deepEqual(getAllowedStatuses("bug"), ["进行中", "已完成", "已拒绝"])
    assert.deepEqual(getAllowedStatuses("custom"), ["进行中", "已完成", "已拒绝"])
  })

  it("不支持的完成状态会回到进行中，避免页面状态过多", () => {
    assert.deepEqual(normalizeStatusForType({ type: "bug", status: "处理中", progress: 88 }), {
      status: "进行中",
      progress: 88,
    })
  })

  it("已完成和已拒绝会落到明确进度", () => {
    assert.deepEqual(normalizeStatusForType({ type: "requirement", status: "已完成", progress: 40 }), {
      status: "已完成",
      progress: 100,
    })
    assert.deepEqual(normalizeStatusForType({ type: "requirement", status: "已拒绝", progress: 40 }), {
      status: "已拒绝",
      progress: 0,
    })
  })

  it("重要程度仍然由 priority 单独表达", () => {
    assert.equal(priorityToLabel("high"), "重要")
    assert.equal(priorityToLabel("medium"), "中等")
    assert.equal(priorityToLabel("low"), "低")
    assert.equal(statusToPriority("重要"), "high")
  })
})

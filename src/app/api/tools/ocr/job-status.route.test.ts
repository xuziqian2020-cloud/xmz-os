import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createOcrJobStatusHandler } from "./[jobId]/handler"

describe("OCR 后台任务状态接口", () => {
  it("完成后返回现有 OCR 输出格式和低置信度页", async () => {
    const get = createOcrJobStatusHandler({
      getJob: (jobId) => ({
        id: jobId,
        fileName: "scan.pdf",
        state: "completed",
        completedPages: 3,
        totalPages: 3,
        lowConfidencePages: [2],
        text: "合同编号 A-1001",
        createdAt: 1,
        updatedAt: 2,
      }),
    })

    const response = await get(new Request("http://localhost/api/tools/ocr/job-1001"), { params: { jobId: "job-1001" } })
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.state, "completed")
    assert.equal(payload.text, "合同编号 A-1001")
    assert.match(payload.markdown, /合同编号 A-1001/)
    assert.deepEqual(payload.lowConfidencePages, [2])
  })

  it("保留运行中任务的页数进度", async () => {
    const get = createOcrJobStatusHandler({
      getJob: () => ({
        id: "job-1002",
        fileName: "scan.pdf",
        state: "running",
        completedPages: 12,
        totalPages: 100,
        lowConfidencePages: [7],
        createdAt: 1,
        updatedAt: 2,
      }),
    })

    const response = await get(new Request("http://localhost/api/tools/ocr/job-1002"), { params: { jobId: "job-1002" } })

    assert.deepEqual(await response.json(), {
      jobId: "job-1002",
      state: "running",
      completedPages: 12,
      totalPages: 100,
      lowConfidencePages: [7],
    })
  })

  it("找不到任务时返回 404", async () => {
    const get = createOcrJobStatusHandler({ getJob: () => undefined })

    const response = await get(new Request("http://localhost/api/tools/ocr/missing"), { params: { jobId: "missing" } })

    assert.deepEqual(await response.json(), { error: "OCR 任务不存在或已过期" })
    assert.equal(response.status, 404)
  })
})

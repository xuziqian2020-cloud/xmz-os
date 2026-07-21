import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createOcrPostHandler } from "./handler"

/** XMZADD 20260721 构造图片上传请求，验证 OCR 提交接口不会等待本机模型完成识别。 */
function createImageRequest(): Request {
  const formData = new FormData()
  formData.set("file", new File([Buffer.from("image")], "scan.png", { type: "image/png" }))
  return new Request("http://localhost/api/tools/ocr", { method: "POST", body: formData })
}

describe("OCR 后台任务提交接口", () => {
  it("有效上传后立即返回 202 和任务编号", async () => {
    let receivedFileName = ""
    const post = createOcrPostHandler({
      createJob: async (file) => {
        receivedFileName = file.fileName
        return {
          id: "job-1001",
          fileName: file.fileName,
          state: "queued",
          completedPages: 0,
          totalPages: null,
          lowConfidencePages: [],
          createdAt: 1,
          updatedAt: 1,
        }
      },
    })

    const response = await post(createImageRequest())

    assert.equal(response.status, 202)
    assert.deepEqual(await response.json(), { jobId: "job-1001", state: "queued" })
    assert.equal(receivedFileName, "scan.png")
  })

  it("在创建后台任务前拒绝不支持的上传文件", async () => {
    let createCallCount = 0
    const post = createOcrPostHandler({
      createJob: async () => {
        createCallCount += 1
        throw new Error("should not run")
      },
    })
    const formData = new FormData()
    formData.set("file", new File([Buffer.from("word")], "contract.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }))

    const response = await post(new Request("http://localhost/api/tools/ocr", { method: "POST", body: formData }))

    assert.equal(response.status, 400)
    assert.equal(createCallCount, 0)
  })
})

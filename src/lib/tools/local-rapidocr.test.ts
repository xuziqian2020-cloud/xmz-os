import assert from "node:assert/strict"
import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"
import {
  createLocalRapidOcrJobManager,
  type RapidOcrWorker,
  type RapidOcrWorkerMessage,
} from "./local-rapidocr"

/** XMZADD 20260721 构造可控的本机工作进程替身，用于验证队列状态而不依赖真实 OCR 模型。 */
class FakeRapidOcrWorker implements RapidOcrWorker {
  private listeners = new Map<string, (message: RapidOcrWorkerMessage) => Promise<void>>()
  private completions = new Map<string, () => void>()

  /** XMZADD 20260721 记录任务消息接收方，使测试可按业务时机模拟识别进度与结束结果。 */
  recognize(jobId: string, _inputPath: string, onMessage: (message: RapidOcrWorkerMessage) => Promise<void>): Promise<void> {
    this.listeners.set(jobId, onMessage)
    return new Promise<void>((resolve) => this.completions.set(jobId, resolve))
  }

  /** XMZADD 20260721 向指定任务发送工作进程事件，复现本机识别的逐页状态变化。 */
  async emit(message: RapidOcrWorkerMessage): Promise<void> {
    await this.listeners.get(message.jobId)?.(message)
    if (message.type === "completed" || message.type === "failed") {
      this.completions.get(message.jobId)?.()
    }
  }

  /** XMZADD 20260721 确认任务已实际交给工作进程，避免测试在进程尚未接收任务时伪造进度。 */
  isRecognizing(jobId: string): boolean {
    return this.listeners.has(jobId)
  }
}

/** XMZADD 20260721 等待异步任务状态落库，避免测试以固定延迟猜测本机队列执行时机。 */
async function waitFor(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (check()) return
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
  }

  throw new Error("Timed out waiting for RapidOCR job state")
}

describe("本机 RapidOCR 后台任务", () => {
  it("接收逐页进度并保留一百页 PDF 的任务", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "local-rapidocr-test-"))
    const worker = new FakeRapidOcrWorker()
    const manager = createLocalRapidOcrJobManager({ projectRoot, worker })

    try {
      const job = await manager.createJob({ fileName: "scan.pdf", buffer: Buffer.from("pdf") })
      await waitFor(() => worker.isRecognizing(job.id))

      await worker.emit({
        type: "progress",
        jobId: job.id,
        completedPages: 100,
        totalPages: 100,
        lowConfidencePages: [99],
      })

      await waitFor(() => manager.getJob(job.id)?.completedPages === 100)
      const current = manager.getJob(job.id)
      assert.equal(current?.state, "running")
      assert.equal(current?.totalPages, 100)
      assert.deepEqual(current?.lowConfidencePages, [99])
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("将第 101 页的工作进程拒绝映射为可读任务失败", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "local-rapidocr-test-"))
    const worker = new FakeRapidOcrWorker()
    const manager = createLocalRapidOcrJobManager({ projectRoot, worker })

    try {
      const job = await manager.createJob({ fileName: "too-many-pages.pdf", buffer: Buffer.from("pdf") })
      await waitFor(() => worker.isRecognizing(job.id))

      await worker.emit({
        type: "failed",
        jobId: job.id,
        code: "page_limit",
        message: "PDF 页数不能超过 100 页",
      })

      await waitFor(() => manager.getJob(job.id)?.state === "failed")
      assert.equal(manager.getJob(job.id)?.error, "PDF 页数不能超过 100 页")
      assert.deepEqual(await readdir(join(projectRoot, ".local-ocr", "jobs", job.id)), ["state.json"])
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

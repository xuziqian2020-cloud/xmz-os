import { existsSync } from "node:fs"
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { basename, extname, join } from "node:path"

export const RAPID_OCR_MAX_PDF_PAGES = 100
const RAPID_OCR_JOB_RETENTION_MS = 2 * 60 * 60 * 1000

export type RapidOcrJobState = "queued" | "running" | "completed" | "failed"

/** XMZADD 20260721 定义本机 RapidOCR 任务对页面和接口公开的最小状态。 */
export interface RapidOcrJob {
  id: string
  fileName: string
  state: RapidOcrJobState
  completedPages: number
  totalPages: number | null
  lowConfidencePages: number[]
  error?: string
  text?: string
  createdAt: number
  updatedAt: number
}

/** XMZADD 20260721 定义 Python 工作进程回传的逐页进度和最终识别结果。 */
export type RapidOcrWorkerMessage =
  | {
    type: "progress"
    jobId: string
    completedPages: number
    totalPages: number
    lowConfidencePages: number[]
  }
  | {
    type: "completed"
    jobId: string
    text: string
    totalPages: number
    lowConfidencePages: number[]
  }
  | {
    type: "failed"
    jobId: string
    code: "page_limit" | "invalid_file" | "recognition_failed"
    message: string
  }

/** XMZADD 20260721 约束常驻工作进程的调用方式，使业务队列可替换真实进程并进行无模型测试。 */
export interface RapidOcrWorker {
  recognize(
    jobId: string,
    inputPath: string,
    onMessage: (message: RapidOcrWorkerMessage) => Promise<void>,
  ): Promise<void>
}

/** XMZADD 20260721 定义创建本机后台任务队列时可替换的目录和工作进程依赖。 */
export interface LocalRapidOcrJobManagerOptions {
  projectRoot?: string
  worker: RapidOcrWorker
  now?: () => number
}

/** XMZADD 20260721 定义 OCR 文件提交到本机后台队列所需的原始业务数据。 */
export interface RapidOcrFile {
  fileName: string
  buffer: Buffer
}

/** XMZADD 20260721 计算 RapidOCR 运行文件均位于项目 E 盘目录下的存放位置。 */
export function getLocalRapidOcrRoot(projectRoot = process.cwd()): string {
  return join(projectRoot, ".local-ocr")
}

/** XMZADD 20260721 将工作进程消息写入业务任务状态，供 OCR API 与页面轮询使用。 */
export interface LocalRapidOcrJobManager {
  createJob(file: RapidOcrFile): Promise<RapidOcrJob>
  getJob(jobId: string): RapidOcrJob | undefined
}

/** XMZADD 20260721 为本机 OCR 维护单并发任务队列，避免多份扫描件争抢 CPU 导致超时。 */
class LocalRapidOcrJobManagerImpl implements LocalRapidOcrJobManager {
  private readonly jobs = new Map<string, RapidOcrJob>()
  private readonly queue: string[] = []
  private activeJobId: string | undefined
  private scheduled = false

  constructor(
    private readonly projectRoot: string,
    private readonly worker: RapidOcrWorker,
    private readonly now: () => number,
  ) {}

  /** XMZADD 20260721 接收用户文件并立即生成后台任务，确保上传请求不等待 OCR 全部完成。 */
  async createJob(file: RapidOcrFile): Promise<RapidOcrJob> {
    await this.cleanupExpiredJobs()

    const now = this.now()
    const job: RapidOcrJob = {
      id: randomUUID(),
      fileName: file.fileName,
      state: "queued",
      completedPages: 0,
      totalPages: null,
      lowConfidencePages: [],
      createdAt: now,
      updatedAt: now,
    }
    const jobDirectory = this.getJobDirectory(job.id)

    await mkdir(jobDirectory, { recursive: true })
    await writeFile(this.getInputPath(job), file.buffer)
    this.jobs.set(job.id, job)
    await this.persistJob(job)
    this.queue.push(job.id)
    this.scheduleNextJob()

    return cloneJob(job)
  }

  /** XMZADD 20260721 读取已登记任务的不可变副本，防止接口调用方修改内存中的队列状态。 */
  getJob(jobId: string): RapidOcrJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? cloneJob(job) : undefined
  }

  /** XMZADD 20260721 延后启动队列，使提交接口稳定返回排队状态而不是受进程调度影响。 */
  private scheduleNextJob(): void {
    if (this.scheduled) return

    this.scheduled = true
    queueMicrotask(() => {
      this.scheduled = false
      void this.runNextJob()
    })
  }

  /** XMZADD 20260721 按提交顺序执行单个 OCR 任务，优先保证长 PDF 的本机运行稳定性。 */
  private async runNextJob(): Promise<void> {
    if (this.activeJobId) return

    const jobId = this.queue.shift()
    if (!jobId) return

    const job = this.jobs.get(jobId)
    if (!job) {
      this.scheduleNextJob()
      return
    }

    this.activeJobId = job.id
    job.state = "running"
    job.updatedAt = this.now()
    await this.persistJob(job)

    try {
      await this.worker.recognize(job.id, this.getInputPath(job), (message) => this.handleWorkerMessage(message))
      if (job.state === "running") {
        await this.finishJob(job, "failed", "本机 RapidOCR 工作进程未返回识别结果")
      }
    } catch {
      if (job.state === "running") {
        await this.finishJob(job, "failed", "本机 RapidOCR 工作进程异常退出，请重试")
      }
    } finally {
      this.activeJobId = undefined
      this.scheduleNextJob()
    }
  }

  /** XMZADD 20260721 接收工作进程的页数进度或结束消息，保持页面状态与真实识别进度一致。 */
  private async handleWorkerMessage(message: RapidOcrWorkerMessage): Promise<void> {
    const job = this.jobs.get(message.jobId)
    if (!job || job.state !== "running") return

    if (message.type === "progress") {
      job.completedPages = message.completedPages
      job.totalPages = message.totalPages
      job.lowConfidencePages = uniquePageNumbers(message.lowConfidencePages)
      job.updatedAt = this.now()
      await this.persistJob(job)
      return
    }

    if (message.type === "completed") {
      job.completedPages = message.totalPages
      job.totalPages = message.totalPages
      job.lowConfidencePages = uniquePageNumbers(message.lowConfidencePages)
      job.text = message.text.trim()
      if (!job.text) {
        await this.finishJob(job, "failed", "没有识别到文字，请换一份更清晰的扫描件")
        return
      }
      await this.finishJob(job, "completed")
      return
    }

    await this.finishJob(job, "failed", message.message)
  }

  /** XMZADD 20260721 在任务结束后立即清除原始扫描件，降低本机敏感文件残留风险。 */
  private async finishJob(job: RapidOcrJob, state: "completed" | "failed", error?: string): Promise<void> {
    await rm(this.getInputPath(job), { force: true })
    job.state = state
    job.error = error
    job.updatedAt = this.now()
    await this.persistJob(job)
  }

  /** XMZADD 20260721 保存可恢复的任务状态，确保当前页面轮询可读取最近一次识别进度。 */
  private async persistJob(job: RapidOcrJob): Promise<void> {
    await writeFile(this.getStatePath(job.id), JSON.stringify(job), "utf8")
  }

  /** XMZADD 20260721 清除超过保留时限的终态任务目录，避免 OCR 结果长期保存在本机磁盘。 */
  private async cleanupExpiredJobs(): Promise<void> {
    const jobsDirectory = this.getJobsDirectory()
    if (!existsSync(jobsDirectory)) return

    const entries = await readdir(jobsDirectory, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const statePath = this.getStatePath(entry.name)
      try {
        const saved = JSON.parse(await readFile(statePath, "utf8")) as Partial<RapidOcrJob>
        const isTerminal = saved.state === "completed" || saved.state === "failed"
        const isExpired = typeof saved.updatedAt === "number" && this.now() - saved.updatedAt > RAPID_OCR_JOB_RETENTION_MS
        if (isTerminal && isExpired) {
          // 任务已被用户读取足够长时间后才删除，兼顾下载结果与敏感数据最小留存。
          await rm(this.getJobDirectory(entry.name), { recursive: true, force: true })
        }
      } catch {
        // 无法读取的旧任务不影响新识别任务，后续可由用户手动清理运行目录。
      }
    }
  }

  /** XMZADD 20260721 为单个 OCR 任务生成隔离目录，避免并发文件相互覆盖。 */
  private getJobDirectory(jobId: string): string {
    return join(this.getJobsDirectory(), jobId)
  }

  /** XMZADD 20260721 返回本机 OCR 队列统一的任务根目录。 */
  private getJobsDirectory(): string {
    return join(getLocalRapidOcrRoot(this.projectRoot), "jobs")
  }

  /** XMZADD 20260721 依据原文件扩展名保存任务输入，便于工作进程按图片或 PDF 分流。 */
  private getInputPath(job: RapidOcrJob): string {
    return join(this.getJobDirectory(job.id), `input${getSafeExtension(job.fileName)}`)
  }

  /** XMZADD 20260721 返回任务状态文件路径，保证结果和状态不会写入应用源码目录。 */
  private getStatePath(jobId: string): string {
    return join(this.getJobDirectory(jobId), "state.json")
  }
}

/** XMZADD 20260721 创建可供 OCR 路由使用的本机 RapidOCR 后台任务管理器。 */
export function createLocalRapidOcrJobManager(options: LocalRapidOcrJobManagerOptions): LocalRapidOcrJobManager {
  return new LocalRapidOcrJobManagerImpl(
    options.projectRoot ?? process.cwd(),
    options.worker,
    options.now ?? Date.now,
  )
}

/** XMZADD 20260721 仅保留受控文件扩展名，避免用户文件名影响本机任务目录结构。 */
function getSafeExtension(fileName: string): string {
  const extension = extname(basename(fileName)).toLowerCase()
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : ".bin"
}

/** XMZADD 20260721 去重并排序低置信度页码，使页面提示稳定且便于用户逐页复核。 */
function uniquePageNumbers(pageNumbers: number[]): number[] {
  return Array.from(new Set(pageNumbers.filter((pageNumber) => Number.isInteger(pageNumber) && pageNumber > 0))).sort((left, right) => left - right)
}

/** XMZADD 20260721 返回任务状态的深度可变副本，隔离后台队列与接口响应数据。 */
function cloneJob(job: RapidOcrJob): RapidOcrJob {
  return {
    ...job,
    lowConfidencePages: [...job.lowConfidencePages],
  }
}

import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { basename, extname, join } from "node:path"

export interface LocalOcrPaths {
  root: string
  python: string
  models: string
  pipCache: string
  temp: string
}

export interface ProcessResult {
  code: number
  stdout: string
  stderr: string
}

export type LocalOcrProcessRunner = (
  command: string,
  argumentsList: string[],
  options?: {
    cwd?: string
    env?: NodeJS.ProcessEnv
    timeoutMs?: number
  },
) => Promise<ProcessResult>

export interface LocalOcrDependencies {
  projectRoot?: string
  runProcess?: LocalOcrProcessRunner
}

/**
 * XMZADD 20260721 统一计算本机 OCR 运行目录，确保运行库和模型保存在项目所在磁盘。
 */
export function getLocalOcrPaths(projectRoot = process.cwd()): LocalOcrPaths {
  const root = join(projectRoot, ".local-ocr")

  return {
    root,
    python: join(root, "venv", "Scripts", "python.exe"),
    models: join(root, "models"),
    pipCache: join(root, "pip-cache"),
    temp: join(root, "temp"),
  }
}

/**
 * XMZADD 20260721 表示本机 OCR 依赖、模型或识别进程不可用时可安全返回的错误。
 */
export class LocalOcrError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "LocalOcrError"
    this.statusCode = statusCode
  }
}

export interface LocalOcrFile {
  fileName: string
  buffer: Buffer
}

const LOCAL_OCR_IMAGE_TIMEOUT_MS = 120_000
const LOCAL_OCR_PDF_TIMEOUT_MS = 600_000

/**
 * XMZADD 20260721 为离线识别进程指定仅使用 E 盘本机目录的缓存和临时环境。
 */
function createLocalOcrEnvironment(paths: LocalOcrPaths): NodeJS.ProcessEnv {
  const home = join(paths.root, "home")

  return {
    ...process.env,
    PIP_CACHE_DIR: paths.pipCache,
    PADDLE_OCR_BASE_DIR: paths.models,
    PADDLE_PDX_CACHE_HOME: paths.models,
    TEMP: paths.temp,
    TMP: paths.temp,
    HOME: home,
    USERPROFILE: home,
    PYTHONUSERBASE: join(paths.root, "python-user"),
    PYTHONPYCACHEPREFIX: join(paths.temp, "pycache"),
  }
}

/**
 * XMZADD 20260721 从用户文件名中保留安全扩展名，避免任务目录受到路径片段影响。
 */
function getSafeExtension(fileName: string): string {
  const extension = extname(basename(fileName)).toLowerCase()

  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : ".bin"
}

/**
 * XMZADD 20260721 为扫描 PDF 预留逐页离线识别所需的等待时间，避免多页文件被图片超时限制提前终止。
 */
function getLocalOcrTimeoutMs(fileName: string): number {
  return getSafeExtension(fileName) === ".pdf"
    ? LOCAL_OCR_PDF_TIMEOUT_MS
    : LOCAL_OCR_IMAGE_TIMEOUT_MS
}

/**
 * XMZADD 20260721 启动隐藏的本机 Python OCR 进程并在超时后终止任务。
 */
async function runLocalOcrProcess(
  command: string,
  argumentsList: string[],
  options?: {
    cwd?: string
    env?: NodeJS.ProcessEnv
    timeoutMs?: number
  },
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd: options?.cwd,
      env: options?.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    const timeout = setTimeout(() => child.kill(), options?.timeoutMs ?? LOCAL_OCR_IMAGE_TIMEOUT_MS)

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk))
    child.on("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on("close", (code) => {
      clearTimeout(timeout)
      resolve({
        code: code ?? -1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      })
    })
  })
}

/**
 * XMZADD 20260721 读取 Python 任务结果中允许交给业务层的纯文本字段。
 */
async function readRecognizedText(outputPath: string): Promise<string> {
  const result = JSON.parse(await readFile(outputPath, "utf8")) as { text?: unknown }

  if (typeof result.text !== "string") {
    throw new Error("Invalid local OCR output")
  }

  return result.text
}

/**
 * XMZADD 20260721 调用离线 PaddleOCR 识别图片或扫描 PDF 并安全返回文字结果。
 */
export async function recognizeLocalOcrFile(
  file: LocalOcrFile,
  dependencies: LocalOcrDependencies = {},
): Promise<string> {
  const projectRoot = dependencies.projectRoot ?? process.cwd()
  const paths = getLocalOcrPaths(projectRoot)

  if (!existsSync(paths.python)) {
    throw new LocalOcrError("本机 OCR 尚未安装，请先执行本机 OCR 安装", 503)
  }

  let jobDirectory: string | undefined
  try {
    await mkdir(paths.temp, { recursive: true })
    jobDirectory = await mkdtemp(join(paths.temp, "job-"))
    const inputPath = join(jobDirectory, `input${getSafeExtension(file.fileName)}`)
    const outputPath = join(jobDirectory, "result.json")
    const scriptPath = join(projectRoot, "scripts", "local-ocr", "recognize.py")

    await writeFile(inputPath, file.buffer)
    const processResult = await (dependencies.runProcess ?? runLocalOcrProcess)(
      paths.python,
      [scriptPath, "--input", inputPath, "--output", outputPath, "--temp-dir", jobDirectory],
      {
        cwd: paths.root,
        env: createLocalOcrEnvironment(paths),
        timeoutMs: getLocalOcrTimeoutMs(file.fileName),
      },
    )

    if (processResult.code !== 0) {
      throw new Error("Local OCR process failed")
    }

    const text = await readRecognizedText(outputPath)
    if (!text.trim()) {
      throw new LocalOcrError("没有识别到文字，请换一份更清晰的扫描件", 422)
    }

    return text
  } catch (error) {
    if (error instanceof LocalOcrError) {
      throw error
    }

    throw new LocalOcrError("本机 OCR 识别失败，请检查本机运行环境", 502)
  } finally {
    if (jobDirectory) {
      // 识别文件可能含有敏感业务内容，任务结束即清理整个临时目录。
      await rm(jobDirectory, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}

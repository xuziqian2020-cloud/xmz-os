import { join } from "node:path"

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

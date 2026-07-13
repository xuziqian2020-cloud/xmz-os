import { createRequire } from "node:module"
import path from "node:path"
import { normalizeImageForOcr } from "./ocr-image"

const require = createRequire(import.meta.url)
const tesseractOptions = {
  workerPath: path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js"),
  corePath: path.join(process.cwd(), "node_modules", "tesseract.js-core"),
  langPath: process.cwd(),
}
const workerCache = new Map<string, Promise<any>>()

export async function recognizeImageText(buffer: Buffer, language: string): Promise<string> {
  const imageBuffer = await normalizeImageForOcr(buffer)
  return withTimeout(async () => {
    const worker = await getWorker(language)
    const result = await worker.recognize(imageBuffer)
    return String(result?.data?.text || "").trim()
  }, 60000)
}

async function getWorker(language: string) {
  const cached = workerCache.get(language)
  if (cached) return cached

  const { createWorker } = require("tesseract.js")
  const workerPromise = createWorker(language, undefined, tesseractOptions).catch((error: unknown) => {
    workerCache.delete(language)
    throw error
  })
  workerCache.set(language, workerPromise)
  return workerPromise
}

async function withTimeout<T>(task: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      task(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("OCR 识别超时，请换一张更清晰的图片或稍后重试")), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

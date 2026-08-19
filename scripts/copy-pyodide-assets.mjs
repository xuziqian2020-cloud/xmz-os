import { copyFile, mkdir, rm } from "node:fs/promises"
import path from "node:path"

/** XMZADD 20260819 将课程浏览器 Python 运行时随网站发布，避免企业网络拦截第三方 CDN 后无法练习。 */
const sourceDirectory = path.join(process.cwd(), "node_modules", "pyodide")
const targetDirectory = path.join(process.cwd(), "public", "learning", "pyodide")
const runtimeFiles = ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "pyodide-lock.json", "python_stdlib.zip"]

await rm(targetDirectory, { recursive: true, force: true })
await mkdir(targetDirectory, { recursive: true })

for (const runtimeFile of runtimeFiles) {
  await copyFile(path.join(sourceDirectory, runtimeFile), path.join(targetDirectory, runtimeFile))
}

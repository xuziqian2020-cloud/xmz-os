import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  LocalOcrError,
  getLocalOcrPaths,
  recognizeLocalOcrFile,
} from "./local-paddle-ocr"

describe("本机 PaddleOCR 运行目录", () => {
  it("固定在项目根目录下的 .local-ocr", () => {
    const paths = getLocalOcrPaths("E:\\XMZAI\\xmz-os")

    assert.equal(paths.root, "E:\\XMZAI\\xmz-os\\.local-ocr")
    assert.equal(paths.python, "E:\\XMZAI\\xmz-os\\.local-ocr\\venv\\Scripts\\python.exe")
    assert.equal(paths.models, "E:\\XMZAI\\xmz-os\\.local-ocr\\models")
    assert.equal(paths.temp, "E:\\XMZAI\\xmz-os\\.local-ocr\\temp")
    assert.equal(paths.pipCache, "E:\\XMZAI\\xmz-os\\.local-ocr\\pip-cache")
  })

  it("保留本机 OCR 错误对应的 HTTP 状态码", () => {
    const error = new LocalOcrError("本机 OCR 环境不可用", 503)

    assert.equal(error.message, "本机 OCR 环境不可用")
    assert.equal(error.statusCode, 503)
    assert.equal(error.name, "LocalOcrError")
  })
})

describe("本机 PaddleOCR 文件识别", () => {
  async function createProjectRoot(): Promise<string> {
    const projectRoot = await mkdtemp(join(tmpdir(), "local-paddle-ocr-test-"))
    const paths = getLocalOcrPaths(projectRoot)

    await mkdir(join(paths.root, "venv", "Scripts"), { recursive: true })
    await writeFile(paths.python, "", "utf8")

    return projectRoot
  }

  it("读取 Python 写入的识别 JSON", async () => {
    const projectRoot = await createProjectRoot()

    try {
      const text = await recognizeLocalOcrFile(
        { fileName: "合同.png", buffer: Buffer.from("image") },
        {
          projectRoot,
          runProcess: async (_command, argumentsList) => {
            const outputIndex = argumentsList.indexOf("--output")
            const outputPath = argumentsList[outputIndex + 1]

            assert.notEqual(outputIndex, -1)
            await writeFile(outputPath, JSON.stringify({ text: "合同编号 1001" }), "utf8")
            return { code: 0, stdout: "", stderr: "" }
          },
        },
      )

      assert.equal(text, "合同编号 1001")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("Python 返回失败时不泄露 stderr", async () => {
    const projectRoot = await createProjectRoot()

    try {
      await assert.rejects(
        recognizeLocalOcrFile(
          { fileName: "合同.png", buffer: Buffer.from("image") },
          {
            projectRoot,
            runProcess: async () => ({ code: 1, stdout: "", stderr: "秘密错误明细" }),
          },
        ),
        (error: unknown) =>
          error instanceof LocalOcrError &&
          error.statusCode === 502 &&
          error.message === "本机 OCR 识别失败，请检查本机运行环境",
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("未安装 Python 时返回 503", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "local-paddle-ocr-test-"))

    try {
      await assert.rejects(
        recognizeLocalOcrFile({ fileName: "合同.png", buffer: Buffer.from("image") }, { projectRoot }),
        (error: unknown) =>
          error instanceof LocalOcrError &&
          error.statusCode === 503 &&
          error.message === "本机 OCR 尚未安装，请先执行本机 OCR 安装",
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("无文字时返回 422", async () => {
    const projectRoot = await createProjectRoot()

    try {
      await assert.rejects(
        recognizeLocalOcrFile(
          { fileName: "合同.png", buffer: Buffer.from("image") },
          {
            projectRoot,
            runProcess: async (_command, argumentsList) => {
              const outputPath = argumentsList[argumentsList.indexOf("--output") + 1]
              await writeFile(outputPath, JSON.stringify({ text: "" }), "utf8")
              return { code: 0, stdout: "", stderr: "" }
            },
          },
        ),
        (error: unknown) => error instanceof LocalOcrError && error.statusCode === 422,
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("无效输出 JSON 时返回 502", async () => {
    const projectRoot = await createProjectRoot()

    try {
      await assert.rejects(
        recognizeLocalOcrFile(
          { fileName: "合同.png", buffer: Buffer.from("image") },
          {
            projectRoot,
            runProcess: async (_command, argumentsList) => {
              const outputPath = argumentsList[argumentsList.indexOf("--output") + 1]
              await writeFile(outputPath, "not-json", "utf8")
              return { code: 0, stdout: "", stderr: "" }
            },
          },
        ),
        (error: unknown) => error instanceof LocalOcrError && error.statusCode === 502,
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("不管结果如何都清理临时任务目录", async () => {
    const projectRoot = await createProjectRoot()
    const paths = getLocalOcrPaths(projectRoot)

    try {
      await assert.rejects(
        recognizeLocalOcrFile(
          { fileName: "合同.png", buffer: Buffer.from("image") },
          {
            projectRoot,
            runProcess: async () => ({ code: 1, stdout: "", stderr: "error" }),
          },
        ),
      )

      assert.deepEqual(await readdir(paths.temp), [])
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

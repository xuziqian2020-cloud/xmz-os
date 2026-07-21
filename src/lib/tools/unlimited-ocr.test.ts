import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  UnlimitedOcrError,
  recognizeUnlimitedOcrFile,
  type UnlimitedOcrFile,
} from "./unlimited-ocr"

type FetchCall = {
  input: RequestInfo | URL
  init?: RequestInit
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function createFile(): UnlimitedOcrFile {
  return {
    fileName: "合同.pdf",
    buffer: Buffer.from("原始文件内容"),
  }
}

describe("百度 Unlimited-OCR 客户端", () => {
  it("获取令牌后提交原始文件，等待一次并下载成功的 Markdown", async () => {
    const calls: FetchCall[] = []
    const sleeps: number[] = []
    const responses = [
      createJsonResponse({ access_token: "access-token" }),
      createJsonResponse({ error_code: 0, result: { task_id: "task-123" } }),
      createJsonResponse({ error_code: 0, result: { status: "pending" } }),
      createJsonResponse({ error_code: 0, result: { status: "success", markdown_url: "https://example.com/result.md" } }),
      new Response("\n# 已识别内容\n\n"),
    ]
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({ input, init })
      const response = responses.shift()
      if (!response) throw new Error("缺少预期的上游响应")
      return response
    }

    const result = await recognizeUnlimitedOcrFile(createFile(), {
      env: {
        BAIDU_OCR_API_KEY: "api-key",
        BAIDU_OCR_SECRET_KEY: "secret-key",
      },
      fetchImpl,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds)
      },
    })

    assert.equal(result, "# 已识别内容")
    assert.deepEqual(sleeps, [5000])
    assert.equal(calls.length, 5)

    const tokenUrl = new URL(String(calls[0].input))
    assert.equal(tokenUrl.origin + tokenUrl.pathname, "https://aip.baidubce.com/oauth/2.0/token")
    assert.equal(tokenUrl.searchParams.get("grant_type"), "client_credentials")
    assert.equal(tokenUrl.searchParams.get("client_id"), "api-key")
    assert.equal(tokenUrl.searchParams.get("client_secret"), "secret-key")
    assert.equal(calls[0].init?.method, "GET")

    assert.equal(
      String(calls[1].input),
      "https://aip.baidubce.com/rest/2.0/brain/online/v2/unlimited-ocr-parser/task?access_token=access-token",
    )
    assert.equal(calls[1].init?.method, "POST")
    assert.equal(calls[1].init?.headers && new Headers(calls[1].init.headers).get("content-type"), "application/x-www-form-urlencoded")
    const submitBody = new URLSearchParams(String(calls[1].init?.body))
    assert.equal(submitBody.get("file_data"), createFile().buffer.toString("base64"))
    assert.equal(submitBody.get("file_name"), "合同.pdf")

    assert.equal(
      String(calls[2].input),
      "https://aip.baidubce.com/rest/2.0/brain/online/v2/unlimited-ocr-parser/task/query?access_token=access-token",
    )
    assert.equal(new URLSearchParams(String(calls[2].init?.body)).get("task_id"), "task-123")
    assert.equal(String(calls[4].input), "https://example.com/result.md")
  })

  it("Markdown 正文读取失败时返回不泄露凭据的 502", async () => {
    const brokenMarkdownResponse = {
      ok: true,
      text: async () => {
        throw new Error("Markdown 正文流失败 access_token=secret-token")
      },
    } as unknown as Response
    const responses = [
      createJsonResponse({ access_token: "access-token" }),
      createJsonResponse({ error_code: 0, result: { task_id: "task-123" } }),
      createJsonResponse({ error_code: 0, result: { status: "success", markdown_url: "https://example.com/result.md" } }),
      brokenMarkdownResponse,
    ]
    const fetchImpl: typeof fetch = async () => {
      const response = responses.shift()
      if (!response) throw new Error("缺少预期的上游响应")
      return response
    }

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && !error.message.includes("access_token=secret-token")
        && error.message === "百度 Unlimited-OCR 上游请求失败"
        && error.statusCode === 502,
    )
  })

  it("缺少凭据时不调用上游并返回 503", async () => {
    let fetchCount = 0
    const fetchImpl: typeof fetch = async () => {
      fetchCount += 1
      return createJsonResponse({})
    }

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), { env: {}, fetchImpl }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && error.message === "尚未配置百度 Unlimited-OCR 凭据"
        && error.statusCode === 503,
    )
    assert.equal(fetchCount, 0)
  })

  it("识别任务失败时不泄露百度任务错误内容", async () => {
    const responses = [
      createJsonResponse({ access_token: "access-token" }),
      createJsonResponse({ error_code: 0, result: { task_id: "task-123" } }),
      createJsonResponse({ error_code: 0, result: { status: "failed", task_error: "文件内容无法识别 access_token=secret-token" } }),
    ]
    const fetchImpl: typeof fetch = async () => {
      const response = responses.shift()
      if (!response) throw new Error("缺少预期的上游响应")
      return response
    }

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && !error.message.includes("access_token=secret-token")
        && error.message === "百度 Unlimited-OCR 识别任务失败"
        && error.statusCode === 502,
    )
  })

  it("任务创建响应缺少 result 时返回 502", async () => {
    const responses = [
      createJsonResponse({ access_token: "access-token" }),
      createJsonResponse({ error_code: 0 }),
    ]
    const fetchImpl: typeof fetch = async () => {
      const response = responses.shift()
      if (!response) throw new Error("缺少预期的上游响应")
      return response
    }

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && error.message === "百度 Unlimited-OCR 未返回 task_id"
        && error.statusCode === 502,
    )
  })

  it("达到最大轮询次数仍未完成时返回 504", async () => {
    const responses = [
      createJsonResponse({ access_token: "access-token" }),
      createJsonResponse({ error_code: 0, result: { task_id: "task-123" } }),
      createJsonResponse({ error_code: 0, result: { status: "pending" } }),
      createJsonResponse({ error_code: 0, result: { status: "pending" } }),
    ]
    const fetchImpl: typeof fetch = async () => {
      const response = responses.shift()
      if (!response) throw new Error("缺少预期的上游响应")
      return response
    }

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
        maxPolls: 2,
        sleep: async () => undefined,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && error.message === "百度 Unlimited-OCR 任务处理超时"
        && error.statusCode === 504,
    )
  })

  it("百度返回 error_code 时不泄露上游错误内容", async () => {
    const fetchImpl: typeof fetch = async () => createJsonResponse({ error_code: 110, error_msg: "Access token invalid access_token=secret-token" })

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && !error.message.includes("access_token=secret-token")
        && error.message === "百度 Unlimited-OCR 上游请求失败"
        && error.statusCode === 502,
    )
  })

  it("上游请求因中止失败时返回不泄露凭据的 502", async () => {
    let requestSignal: AbortSignal | null = null
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestSignal = init?.signal || null
      const abortError = new Error("请求已中止")
      abortError.name = "AbortError"
      throw abortError
    }

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && !error.message.includes("secret-key")
        && error.message === "百度 Unlimited-OCR 上游请求失败"
        && error.statusCode === 502,
    )
    assert.ok(requestSignal)
  })

  it("上游 HTTP 非成功状态时返回 502", async () => {
    const fetchImpl: typeof fetch = async () => new Response("Bad Gateway", { status: 502 })

    await assert.rejects(
      recognizeUnlimitedOcrFile(createFile(), {
        env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" },
        fetchImpl,
      }),
      (error: unknown) => error instanceof UnlimitedOcrError
        && error.message === "百度 Unlimited-OCR 上游请求失败（HTTP 502）"
        && error.statusCode === 502,
    )
  })
})

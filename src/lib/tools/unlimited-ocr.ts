/** XMZADD 20260721 百度 Unlimited-OCR 已停用，仅为后续恢复保留，业务路由不得导入或调用。 */
const BAIDU_OAUTH_URL = "https://aip.baidubce.com/oauth/2.0/token"
const BAIDU_UNLIMITED_OCR_URL = "https://aip.baidubce.com/rest/2.0/brain/online/v2/unlimited-ocr-parser/task"
const DEFAULT_MAX_POLLS = 12
const POLL_INTERVAL_MILLISECONDS = 5000
const REQUEST_TIMEOUT_MS = 30000

type BaiduOcrResponse = {
  access_token?: unknown
  error_code?: unknown
  error_msg?: unknown
  result?: {
    markdown_url?: unknown
    status?: unknown
    task_error?: unknown
    task_id?: unknown
  }
}

/** XMZADD 20260720 定义百度 Unlimited-OCR 待识别文件的名称与二进制内容。 */
export interface UnlimitedOcrFile {
  fileName: string
  buffer: Buffer
}

/** XMZADD 20260720 定义百度 Unlimited-OCR 服务调用所需的可替换运行时依赖。 */
export interface UnlimitedOcrDependencies {
  env?: NodeJS.ProcessEnv
  fetchImpl?: typeof fetch
  sleep?: (milliseconds: number) => Promise<void>
  maxPolls?: number
}

/** XMZADD 20260720 表示百度 Unlimited-OCR 服务不可用时可返回给调用方的状态错误。 */
export class UnlimitedOcrError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "UnlimitedOcrError"
    this.statusCode = statusCode
  }
}

/** XMZADD 20260720 调用百度 Unlimited-OCR 异步任务并返回已清理的 Markdown 识别结果。 */
export async function recognizeUnlimitedOcrFile(
  file: UnlimitedOcrFile,
  dependencies: UnlimitedOcrDependencies = {},
): Promise<string> {
  const env = dependencies.env || process.env
  const apiKey = env.BAIDU_OCR_API_KEY?.trim()
  const secretKey = env.BAIDU_OCR_SECRET_KEY?.trim()
  if (!apiKey || !secretKey) {
    throw new UnlimitedOcrError("尚未配置百度 Unlimited-OCR 凭据", 503)
  }

  const fetchImpl = dependencies.fetchImpl || fetch
  const accessTokenResponse = await requestJson(
    fetchImpl,
    `${BAIDU_OAUTH_URL}?${new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: secretKey,
    }).toString()}`,
    { method: "GET" },
  )
  const accessToken = getRequiredString(accessTokenResponse.access_token, "百度 Unlimited-OCR 未返回 access_token")

  const submitBody = new URLSearchParams({
    file_data: file.buffer.toString("base64"),
    file_name: file.fileName,
  })
  const createTaskResponse = await requestJson(fetchImpl, buildTaskUrl(accessToken), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: submitBody,
  })
  const taskId = getRequiredString(createTaskResponse.result?.task_id, "百度 Unlimited-OCR 未返回 task_id")
  const maxPolls = getMaxPolls(dependencies.maxPolls)
  const sleep = dependencies.sleep || ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)))

  for (let pollCount = 0; pollCount < maxPolls; pollCount += 1) {
    const queryBody = new URLSearchParams({ task_id: taskId })
    const queryResponse = await requestJson(fetchImpl, buildTaskUrl(accessToken, "/query"), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: queryBody,
    })
    const taskStatus = getRequiredString(queryResponse.result?.status, "百度 Unlimited-OCR 未返回任务状态")

    if (taskStatus === "success") {
      const markdownUrl = getRequiredString(queryResponse.result?.markdown_url, "百度 Unlimited-OCR 未返回 Markdown 下载地址")
      const markdownResponse = await requestText(fetchImpl, markdownUrl)
      const markdown = markdownResponse.trim()
      if (!markdown) {
        throw new UnlimitedOcrError("百度 Unlimited-OCR 未返回有效 Markdown 内容", 502)
      }
      return markdown
    }

    if (taskStatus === "failed") {
      getRequiredString(queryResponse.result?.task_error, "百度 Unlimited-OCR 任务失败但未返回原因")
      throw new UnlimitedOcrError("百度 Unlimited-OCR 识别任务失败", 502)
    }

    if (pollCount < maxPolls - 1) {
      // 等待任务状态变化，避免无效轮询消耗服务配额。
      await sleep(POLL_INTERVAL_MILLISECONDS)
    }
  }

  throw new UnlimitedOcrError("百度 Unlimited-OCR 任务处理超时", 504)
}

/** XMZADD 20260720 统一检查百度接口响应，保证调用方获得可识别的中文上游错误。 */
async function requestJson(fetchImpl: typeof fetch, input: RequestInfo | URL, init?: RequestInit): Promise<BaiduOcrResponse> {
  const response = await request(fetchImpl, input, init)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new UnlimitedOcrError("百度 Unlimited-OCR 上游响应格式无效", 502)
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new UnlimitedOcrError("百度 Unlimited-OCR 上游响应格式无效", 502)
  }

  const result = payload as BaiduOcrResponse
  if (result.error_code !== undefined && result.error_code !== 0) {
    throw new UnlimitedOcrError("百度 Unlimited-OCR 上游请求失败", 502)
  }
  return result
}

/** XMZADD 20260720 下载百度 Unlimited-OCR 返回的 Markdown 文件并保留其原始文本。 */
async function requestText(fetchImpl: typeof fetch, input: RequestInfo | URL): Promise<string> {
  const response = await request(fetchImpl, input)
  try {
    return await response.text()
  } catch {
    throw new UnlimitedOcrError("百度 Unlimited-OCR 上游请求失败", 502)
  }
}

/** XMZADD 20260720 检查百度 HTTP 响应状态，防止错误页面被当成业务结果继续处理。 */
async function request(fetchImpl: typeof fetch, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // 限制单次上游请求，避免轮询上限无法终止挂起连接。
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const requestSignal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal
  let response: Response
  try {
    response = await fetchImpl(input, { ...init, signal: requestSignal })
  } catch {
    throw new UnlimitedOcrError("百度 Unlimited-OCR 上游请求失败", 502)
  }

  if (!response.ok) {
    throw new UnlimitedOcrError(`百度 Unlimited-OCR 上游请求失败（HTTP ${response.status}）`, 502)
  }
  return response
}

/** XMZADD 20260720 从百度响应中读取不可为空的文本字段，防止残缺响应导致识别结果失真。 */
function getRequiredString(value: unknown, errorMessage: string): string {
  const text = getOptionalString(value)
  if (!text) {
    throw new UnlimitedOcrError(errorMessage, 502)
  }
  return text
}

/** XMZADD 20260720 将百度响应字段转换为可用文本，统一排除空白值。 */
function getOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/** XMZADD 20260720 规范轮询次数，避免非法配置造成无限等待或无意义请求。 */
function getMaxPolls(value: number | undefined): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : DEFAULT_MAX_POLLS
}

/** XMZADD 20260720 构造携带访问令牌的百度 Unlimited-OCR 任务接口地址。 */
function buildTaskUrl(accessToken: string, suffix = ""): string {
  return `${BAIDU_UNLIMITED_OCR_URL}${suffix}?access_token=${encodeURIComponent(accessToken)}`
}

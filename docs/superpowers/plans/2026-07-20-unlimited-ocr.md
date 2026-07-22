# Unlimited-OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用百度 Unlimited-OCR 识别图片和 PDF，取代本地 Tesseract OCR。

**Architecture:** `unlimited-ocr.ts` 统一完成 OAuth、任务提交、5 秒轮询和 Markdown 下载。OCR 工具路由和图片资料导入调用该服务；输出模块将 Markdown 转为现有文本、表格和 Word 数据。

**Tech Stack:** Next.js 13、Node.js 20 fetch、TypeScript、Node Test Runner、百度 Unlimited-OCR REST API。

---

## 变更文件

- 新增 `src/lib/tools/unlimited-ocr.ts` 与 `src/lib/tools/unlimited-ocr.test.ts`。
- 修改 `src/lib/tools/ocr-image.ts`、`src/lib/tools/ocr-image.test.ts`、`src/lib/tools/ocr-output.ts`、`src/lib/tools/ocr-output.test.ts`。
- 修改 `src/app/api/tools/ocr/route.ts`、`src/app/api/tools/extract-document/route.ts`、`src/app/tools/ocr/page.tsx`、`src/lib/tools/ai-tools-regression.test.ts`。
- 删除 `src/lib/tools/ocr-recognize.ts`，并从 `package.json`、`package-lock.json` 移除 `tesseract.js` 和 `sharp`。

### Task 1: 新增百度 Unlimited-OCR 客户端

**Files:**
- Create: `src/lib/tools/unlimited-ocr.test.ts`
- Create: `src/lib/tools/unlimited-ocr.ts`

- [ ] **Step 1: 编写失败测试**

测试通过可注入 `fetchImpl` 模拟以下顺序：OAuth 返回 token、提交返回 task_id、第一次查询 pending、第二次查询 success 和 markdown_url、下载返回 Markdown。断言提交表单含 `file_data` 与 `file_name`，并断言 `sleep` 只接收 `5000`。分别再测试缺少任一环境变量、`failed` 带 `task_error` 和 `maxPolls` 到期。

```ts
it("submits the original file and polls once before downloading Markdown", async () => {
  const waits: number[] = []
  const markdown = await recognizeUnlimitedOcrFile(
    { fileName: "contract.pdf", buffer: Buffer.from("pdf-content") },
    { env: { BAIDU_OCR_API_KEY: "api-key", BAIDU_OCR_SECRET_KEY: "secret-key" }, fetchImpl, sleep: async (ms) => { waits.push(ms) } }
  )
  assert.match(markdown, /合同/)
  assert.match(requests[1].body, /file_name=contract.pdf/)
  assert.match(requests[1].body, /file_data=cGRmLWNvbnRlbnQ%3D/)
  assert.deepEqual(waits, [5000])
})
```

- [ ] **Step 2: 运行 RED 测试**

Run: `npm test -- src/lib/tools/unlimited-ocr.test.ts`

Expected: FAIL，服务模块尚不存在。

- [ ] **Step 3: 实现服务模块**

创建以下导出和辅助函数。导出类和函数用 `XMZADD 20260720` 文档注释；轮询前用中文注释解释“避免无效轮询消耗服务配额”。

```ts
const TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token"
const TASK_URL = "https://aip.baidubce.com/rest/2.0/brain/online/v2/unlimited-ocr-parser/task"
const QUERY_URL = "https://aip.baidubce.com/rest/2.0/brain/online/v2/unlimited-ocr-parser/task/query"
const POLL_INTERVAL_MS = 5000

export type UnlimitedOcrFile = { fileName: string; buffer: Buffer }
export type UnlimitedOcrDependencies = { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch; sleep?: (milliseconds: number) => Promise<void>; maxPolls?: number }

/** XMZADD 20260720 表示百度 Unlimited-OCR 服务可向调用方展示的业务错误。 */
export class UnlimitedOcrError extends Error {
  constructor(message: string, public readonly statusCode: number) { super(message) }
}

/** XMZADD 20260720 将单个图片或 PDF 提交至百度 Unlimited-OCR 并返回 Markdown。 */
export async function recognizeUnlimitedOcrFile(file: UnlimitedOcrFile, deps: UnlimitedOcrDependencies = {}): Promise<string> {
  const env = deps.env || process.env
  const apiKey = String(env.BAIDU_OCR_API_KEY || "").trim()
  const secretKey = String(env.BAIDU_OCR_SECRET_KEY || "").trim()
  const fetchImpl = deps.fetchImpl || fetch
  const sleep = deps.sleep || ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)))
  const maxPolls = deps.maxPolls || 12
  if (!apiKey || !secretKey) throw new UnlimitedOcrError("尚未配置百度 Unlimited-OCR 凭据", 503)
  const token = await getAccessToken(apiKey, secretKey, fetchImpl)
  const taskId = await submitTask(file, token, fetchImpl)
  for (let poll = 0; poll < maxPolls; poll += 1) {
    const result = await queryTask(taskId, token, fetchImpl)
    if (result.status === "success") return downloadMarkdown(String(result.markdown_url || ""), fetchImpl)
    if (result.status === "failed") throw new UnlimitedOcrError(String(result.task_error || "Unlimited-OCR 识别失败"), 502)
    if (poll < maxPolls - 1) await sleep(POLL_INTERVAL_MS)
  }
  throw new UnlimitedOcrError("识别任务尚未完成，请稍后重试", 504)
}
```

`getAccessToken` 以 `grant_type=client_credentials`、`client_id`、`client_secret` 调用 `TOKEN_URL`；`submitTask` 以 URL 编码表单 `{ file_data: buffer.toString("base64"), file_name }` 调用 `TASK_URL?access_token=`；`queryTask` 以 `{ task_id }` 调用 `QUERY_URL?access_token=`。这三个函数遇到非 2xx、非零 `error_code`、缺少 token/task_id/result 时抛出 `UnlimitedOcrError(消息, 502)`。`downloadMarkdown` 拒绝空 URL、非 2xx 和空响应，成功时返回 `response.text().trim()`。

- [ ] **Step 4: 运行 GREEN 测试**

Run: `npm test -- src/lib/tools/unlimited-ocr.test.ts`

Expected: PASS，OAuth、提交、轮询、下载、凭据缺失、失败任务和超时全部通过。

- [ ] **Step 5: 提交任务**

```bash
git add src/lib/tools/unlimited-ocr.ts src/lib/tools/unlimited-ocr.test.ts
git commit -m "feat: add Baidu Unlimited-OCR client"
```

### Task 2: 支持 PDF 输入与 Markdown 输出

**Files:**
- Modify: `src/lib/tools/ocr-image.ts`
- Modify: `src/lib/tools/ocr-image.test.ts`
- Modify: `src/lib/tools/ocr-output.ts`
- Modify: `src/lib/tools/ocr-output.test.ts`

- [ ] **Step 1: 编写失败测试**

在输入测试中断言 PDF 接受、DOCX 拒绝、图片超过 10MB 和 PDF 超过 100MB 返回中文错误。在输出测试中传入 `# 账单\n\n| 姓名 | 金额 |\n| --- | --- |\n| 张三 | 120 |`，断言 Markdown 保留、文本含“张三”、表格含 `姓名\t金额`；再断言 HTML 表格转换为 `名称\t金额\n张三\t120`。

- [ ] **Step 2: 运行 RED 测试**

Run: `npm test -- src/lib/tools/ocr-image.test.ts src/lib/tools/ocr-output.test.ts`

Expected: FAIL，现有代码没有 PDF 校验和 Markdown 转换。

- [ ] **Step 3: 实现最小兼容层**

保留 `isSupportedImageFile`，删除 `getOcrLanguage`、`normalizeImageForOcr` 和 Sharp 导入。新增如下实现，并为导出函数加 `XMZADD 20260720` 文档注释：

```ts
export function isSupportedOcrFile(file: OcrFileLike): boolean {
  const type = String(file.type || "").toLowerCase()
  return isSupportedImageFile(file) || type === "application/pdf" || getFileExtension(file.name || "") === "pdf"
}

export function validateOcrFile(file: OcrFileLike): string | null {
  if (!isSupportedOcrFile(file)) return "请上传图片或 PDF 文件"
  const isPdf = String(file.type || "").toLowerCase() === "application/pdf" || getFileExtension(file.name || "") === "pdf"
  const limit = isPdf ? 100 * 1024 * 1024 : 10 * 1024 * 1024
  if (Number(file.size || 0) > limit) return isPdf ? "PDF 文件不能超过 100MB" : "图片文件不能超过 10MB"
  return null
}

export function extractPlainTextFromMarkdown(markdown: string): string {
  return String(markdown || "")
    .replace(/<\/(?:p|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<(?:td|th)[^>]*>/gi, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]+\|?\s*$/gm, "")
    .replace(/^\s*\|/gm, "")
    .replace(/\|\s*$/gm, "")
    .replace(/\|/g, "\t")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
```

将 `buildOcrResultPayload(fileName, markdown)` 改为：`text` 使用 `extractPlainTextFromMarkdown(markdown)`，`markdown` 保留归一化服务结果，`tableText` 使用已有 `plainTextToTable(text)`，`wordFile` 继续基于 `text` 创建。

- [ ] **Step 4: 运行 GREEN 测试**

Run: `npm test -- src/lib/tools/ocr-image.test.ts src/lib/tools/ocr-output.test.ts`

Expected: PASS，图片兼容、PDF、大小限制和 Markdown/HTML 表格测试通过。

- [ ] **Step 5: 提交任务**

```bash
git add src/lib/tools/ocr-image.ts src/lib/tools/ocr-image.test.ts src/lib/tools/ocr-output.ts src/lib/tools/ocr-output.test.ts
git commit -m "feat: support Unlimited-OCR file formats and output"
```

### Task 3: 接入两个后端流程和 OCR 页面

**Files:**
- Modify: `src/app/api/tools/ocr/route.ts`
- Modify: `src/app/api/tools/extract-document/route.ts`
- Modify: `src/app/tools/ocr/page.tsx`
- Modify: `src/lib/tools/ai-tools-regression.test.ts`

- [ ] **Step 1: 编写失败回归测试**

回归测试读取 OCR 路由、资料导入路由和 OCR 页面，并断言两个路由均包含 `recognizeUnlimitedOcrFile` 且均不含 `tesseract`，页面包含 `application/pdf`。

- [ ] **Step 2: 运行 RED 测试**

Run: `npm test -- src/lib/tools/ai-tools-regression.test.ts`

Expected: FAIL，当前实现仍调用 `recognizeImageText`，页面仅接受图片。

- [ ] **Step 3: 进行最小接入**

OCR 路由读取 `file` 后先调用 `validateOcrFile`；失败时返回 400。成功路径按下列代码提交原始字节，`UnlimitedOcrError` 返回自身状态码与中文信息，其它异常返回通用 500：

```ts
const markdown = await recognizeUnlimitedOcrFile({
  fileName: file.name,
  buffer: Buffer.from(await file.arrayBuffer()),
})
const result = buildOcrResultPayload(file.name, markdown)
if (!result.text.trim()) return NextResponse.json({ error: "没有识别到文字，请换一份更清晰的文件" }, { status: 422 })
return NextResponse.json(result)
```

资料导入仅替换图片分支：调用 `recognizeUnlimitedOcrFile({ fileName: name, buffer })`，再以 `extractPlainTextFromMarkdown(markdown)` 保存文本；PDF 分支的 `pdf-parse` 保持不变。OCR 页面删除 `allowOcrLanguage`，并使用：

```tsx
desc="上传图片或 PDF 后，使用百度 Unlimited-OCR 提取文字与文档版式。"
accept="image/*,application/pdf,.pdf"
```

- [ ] **Step 4: 运行 GREEN 测试**

Run: `npm test -- src/lib/tools/ai-tools-regression.test.ts`

Expected: PASS，两个后端 OCR 流程都用 Unlimited-OCR，页面接受 PDF。

- [ ] **Step 5: 提交任务**

```bash
git add src/app/api/tools/ocr/route.ts src/app/api/tools/extract-document/route.ts src/app/tools/ocr/page.tsx src/lib/tools/ai-tools-regression.test.ts
git commit -m "feat: use Unlimited-OCR for OCR workflows"
```

### Task 4: 删除本地 OCR 并完整验证

**Files:**
- Delete: `src/lib/tools/ocr-recognize.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: 添加失败的依赖断言并运行**

在 OCR 回归测试中读取根目录 `package.json`，断言不含 `"tesseract.js"` 和 `"sharp"`。运行：

```bash
npm test -- src/lib/tools/ai-tools-regression.test.ts
```

Expected: FAIL，两个依赖尚未移除。

- [ ] **Step 2: 删除 Worker 并移除依赖**

使用 `apply_patch` 删除 `src/lib/tools/ocr-recognize.ts`，然后运行：

```bash
npm uninstall tesseract.js sharp
```

- [ ] **Step 3: 完整验证**

Run: `npm test -- src/lib/tools/unlimited-ocr.test.ts src/lib/tools/ocr-image.test.ts src/lib/tools/ocr-output.test.ts src/lib/tools/ai-tools-regression.test.ts`

Expected: PASS，指定 OCR 测试通过。

Run: `npm test`

Expected: PASS，全部测试通过。

Run: `npm run build`

Expected: PASS，生产构建完成且无 TypeScript 错误。

- [ ] **Step 4: 检查范围并提交**

```bash
git diff --check
git status --short
git add src/lib/tools/ocr-recognize.ts package.json package-lock.json src/lib/tools/ai-tools-regression.test.ts
git commit -m "chore: remove local Tesseract OCR dependencies"
```

仅暂存本计划列出的文件；不提交已有无关改动。

## 部署清单

- 配置 `BAIDU_OCR_API_KEY` 与 `BAIDU_OCR_SECRET_KEY`。
- 在百度智能云开通文档解析（Unlimited-OCR）。
- 上线后各上传一份图片和 PDF，确认 Markdown、文本、表格和 Word 下载可用。

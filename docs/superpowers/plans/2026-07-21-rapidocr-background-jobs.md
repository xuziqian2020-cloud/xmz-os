# RapidOCR 本机后台任务 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** 将 \`/tools/ocr\` 改为完全本机运行的 RapidOCR 后台任务，支持不超过 100 页的扫描 PDF，并显示逐页进度与低置信度页提醒。

**Architecture:** Next.js 通过单例任务管理器保存队列和任务状态，并启动一个 JSON Lines 协议的 Python 工作进程。工作进程只初始化一次 RapidOCR 模型，按队列逐页渲染和识别；前端提交任务后轮询任务状态，完成时继续使用现有 OCR 输出格式。

**Tech Stack:** Next.js 13 Route Handlers、React 18、TypeScript、Node.js \`child_process\`、Python 3.10、RapidOCR、ONNX Runtime、PyMuPDF、Node Test Runner。

---

## 文件结构

- Create: \`scripts/local-ocr/rapidocr-worker.py\` — 常驻 RapidOCR 进程与 JSON Lines 协议。
- Create: \`scripts/setup-local-rapidocr.ps1\` — E 盘本机环境安装、验证脚本。
- Create: \`src/lib/tools/local-rapidocr.ts\` — 任务状态、单任务队列、Python 进程通信、清理与错误转换。
- Create: \`src/lib/tools/local-rapidocr.test.ts\` — 队列、进度、页数限制、清理、进程失败的单元测试。
- Create: \`src/app/api/tools/ocr/[jobId]/route.ts\` 与测试 — 任务状态接口。
- Create: \`src/components/tools/ocr-tool.tsx\` — OCR 专用的异步上传、进度和结果下载组件。
- Modify: \`src/app/api/tools/ocr/handler.ts\`、\`route.test.ts\` — 从同步识别改为提交任务。
- Modify: \`src/app/tools/ocr/page.tsx\`、\`src/lib/tools/ocr-image.ts\`、对应测试与回归断言。

### Task 1: 定义并测试本机任务队列

**Files:**
- Create: \`src/lib/tools/local-rapidocr.ts\`
- Create: \`src/lib/tools/local-rapidocr.test.ts\`

- [ ] **Step 1: 写入失败测试**

\`\`\`ts
it("accepts worker progress and rejects a PDF over 100 pages", async () => {
  const worker = createFakeWorker()
  const manager = createLocalRapidOcrJobManager({ root: projectRoot, worker })
  const job = await manager.createJob({ fileName: "scan.pdf", buffer: Buffer.from("pdf") })

  worker.emit({ type: "progress", jobId: job.id, completedPages: 12, totalPages: 100 })
  assert.equal(manager.getJob(job.id)?.state, "running")
  assert.equal(manager.getJob(job.id)?.completedPages, 12)

  worker.emit({ type: "failed", jobId: job.id, code: "page_limit", message: "PDF 页数不能超过 100 页" })
  assert.equal(manager.getJob(job.id)?.state, "failed")
  assert.equal(manager.getJob(job.id)?.error, "PDF 页数不能超过 100 页")
})
\`\`\`

- [ ] **Step 2: 运行 RED 测试**

Run: \`npm test -- src/lib/tools/local-rapidocr.test.ts\`

Expected: FAIL，原因是任务管理器尚不存在。

- [ ] **Step 3: 最小化实现队列**

在 \`local-rapidocr.ts\` 声明以下公共模型，并实现单并发 FIFO 队列、任务目录写入、结果 JSON 保存和两小时终态目录清理：

\`\`\`ts
export type RapidOcrJobState = "queued" | "running" | "completed" | "failed"

export type RapidOcrJob = {
  id: string
  fileName: string
  state: RapidOcrJobState
  completedPages: number
  totalPages: number | null
  lowConfidencePages: number[]
  error?: string
  text?: string
}

export const RAPID_OCR_MAX_PDF_PAGES = 100
\`\`\`

原始文件写入 \`.local-ocr/jobs/<id>/input.<ext>\`。完成或失败时删除原始文件和页图，只保留状态与完成结果，供当前浏览器下载。

- [ ] **Step 4: 运行 GREEN 测试**

Run: \`npm test -- src/lib/tools/local-rapidocr.test.ts\`

Expected: PASS。

- [ ] **Step 5: 提交**

\`\`\`bash
git add src/lib/tools/local-rapidocr.ts src/lib/tools/local-rapidocr.test.ts
git commit -m "feat: add local RapidOCR job queue"
\`\`\`

### Task 2: 实现常驻 Python RapidOCR 工作进程

**Files:**
- Create: \`scripts/local-ocr/rapidocr-worker.py\`
- Create: \`scripts/setup-local-rapidocr.ps1\`
- Modify: \`src/lib/tools/local-rapidocr.ts\`
- Modify: \`src/lib/tools/local-rapidocr.test.ts\`

- [ ] **Step 1: 写入完成状态的失败测试**

\`\`\`ts
it("stores completed text and low confidence pages", async () => {
  const job = await manager.createJob({ fileName: "scan.pdf", buffer: Buffer.from("pdf") })
  worker.emit({
    type: "completed",
    jobId: job.id,
    text: "合同编号 A-1001",
    totalPages: 2,
    lowConfidencePages: [2],
  })

  assert.equal(manager.getJob(job.id)?.state, "completed")
  assert.deepEqual(manager.getJob(job.id)?.lowConfidencePages, [2])
})
\`\`\`

- [ ] **Step 2: 运行 RED 测试**

Run: \`npm test -- src/lib/tools/local-rapidocr.test.ts\`

Expected: FAIL，完成消息尚未保存文字与低置信度页。

- [ ] **Step 3: 实现协议和进程适配**

Python 启动时创建一次 \`RapidOCR()\`，之后从 stdin 逐行读取任务。stdout 只输出下列 JSON Lines；库日志写 stderr，防止破坏协议：

\`\`\`json
{"type":"ready"}
{"type":"progress","jobId":"...","completedPages":12,"totalPages":100,"lowConfidencePages":[7]}
{"type":"completed","jobId":"...","text":"...","totalPages":100,"lowConfidencePages":[7]}
{"type":"failed","jobId":"...","code":"page_limit","message":"PDF 页数不能超过 100 页"}
\`\`\`

PDF 使用 PyMuPDF 先读取页数；超过 100 页立即返回 \`page_limit\`。其余 PDF 逐页以 300 DPI 渲染、识别后立即删除页图；任一识别行分数小于 \`0.70\` 时记录该页。Node 端无效 stdout 行直接忽略；Python 异常退出时当前任务失败，下一任务重新启动进程。

安装脚本必须只使用 \`.local-ocr\\venv\\Scripts\\python.exe\`，并把 \`PIP_CACHE_DIR\`、\`TEMP\`、\`TMP\`、\`HOME\`、\`USERPROFILE\` 指向 \`.local-ocr\`：

\`\`\`powershell
& $python -m pip install --upgrade rapidocr onnxruntime
& $python -m rapidocr check
& $python -m pip freeze | Set-Content -Encoding utf8 "$localOcrRoot\requirements-rapidocr.txt"
\`\`\`

- [ ] **Step 4: 运行 GREEN 测试和安装验证**

Run: \`npm test -- src/lib/tools/local-rapidocr.test.ts\`

Expected: PASS。

Run: \`powershell -ExecutionPolicy Bypass -File scripts/setup-local-rapidocr.ps1\`

Expected: \`rapidocr check\` 成功，且 requirements 文件生成在 E 盘。

- [ ] **Step 5: 提交**

\`\`\`bash
git add scripts/local-ocr/rapidocr-worker.py scripts/setup-local-rapidocr.ps1 src/lib/tools/local-rapidocr.ts src/lib/tools/local-rapidocr.test.ts
git commit -m "feat: add persistent RapidOCR worker"
\`\`\`

### Task 3: 替换 OCR API 为提交与查询接口

**Files:**
- Modify: \`src/app/api/tools/ocr/handler.ts\`
- Modify: \`src/app/api/tools/ocr/route.test.ts\`
- Create: \`src/app/api/tools/ocr/[jobId]/route.ts\`
- Create: \`src/app/api/tools/ocr/[jobId]/route.test.ts\`

- [ ] **Step 1: 写入 API RED 测试**

\`\`\`ts
it("returns 202 and a job id immediately after upload", async () => {
  const post = createOcrPostHandler({
    createJob: async () => ({
      id: "job-1001", state: "queued", completedPages: 0,
      totalPages: null, lowConfidencePages: [], fileName: "scan.png",
    }),
  })
  const response = await post(createImageRequest())
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { jobId: "job-1001", state: "queued" })
})
\`\`\`

状态接口的测试使用 \`completed\` 任务，断言响应包含现有的 \`text\`、\`markdown\`、\`tableText\`、\`wordFile\` 和 \`lowConfidencePages\`。

- [ ] **Step 2: 运行 RED 测试**

Run: \`npm test -- src/app/api/tools/ocr/route.test.ts src/app/api/tools/ocr/[jobId]/route.test.ts\`

Expected: FAIL，当前路由仍同步等待 PaddleOCR。

- [ ] **Step 3: 实现路由**

\`POST /api/tools/ocr\` 保留现有输入和 50MB 校验，仅调用 \`createJob\`：

\`\`\`ts
return NextResponse.json({ jobId: job.id, state: job.state }, { status: 202 })
\`\`\`

\`GET /api/tools/ocr/[jobId]\` 对排队和运行任务返回页数进度；完成时调用 \`buildOcrResultPayload(job.fileName, job.text)\` 并附加低置信度页；不存在的任务返回 404；失败任务返回任务状态与可读错误，供页面显示而非抛出网络错误。

- [ ] **Step 4: 运行 GREEN 测试**

Run: \`npm test -- src/app/api/tools/ocr/route.test.ts src/app/api/tools/ocr/[jobId]/route.test.ts\`

Expected: PASS。

- [ ] **Step 5: 提交**

\`\`\`bash
git add src/app/api/tools/ocr
git commit -m "feat: expose RapidOCR job status API"
\`\`\`

### Task 4: 构建 OCR 专用异步页面

**Files:**
- Create: \`src/components/tools/ocr-tool.tsx\`
- Modify: \`src/app/tools/ocr/page.tsx\`
- Modify: \`src/lib/tools/local-rapidocr.ts\`
- Modify: \`src/lib/tools/local-rapidocr.test.ts\`

- [ ] **Step 1: 写入文案函数的 RED 测试**

\`\`\`ts
assert.equal(getOcrJobProgressText({ state: "running", completedPages: 12, totalPages: 100 }), "正在识别第 12 / 100 页")
assert.equal(getOcrJobProgressText({ state: "queued", completedPages: 0, totalPages: null }), "任务排队中")
assert.equal(getLowConfidenceText([2, 5]), "第 2、5 页置信度较低，建议核对原件")
\`\`\`

- [ ] **Step 2: 运行 RED 测试**

Run: \`npm test -- src/lib/tools/local-rapidocr.test.ts\`

Expected: FAIL，文案函数尚不存在。

- [ ] **Step 3: 实现轮询和下载页面**

组件提交成功后每秒请求 \`/api/tools/ocr/<jobId>\`，直到 \`completed\` 或 \`failed\`；卸载时清除定时器。完成时保存三个文本输出和 Word 文件数据，下载逻辑与现有 \`AiFileTool\` 保持一致。页面文案固定为“本机 RapidOCR 离线识别，支持图片和最多 100 页的 PDF，不上传云端。”。

- [ ] **Step 4: 运行 GREEN 测试与构建**

Run: \`npm test -- src/lib/tools/local-rapidocr.test.ts\`

Expected: PASS。

Run: \`npm run build\`

Expected: EXIT 0，动态状态路由通过 Next.js 类型检查。

- [ ] **Step 5: 提交**

\`\`\`bash
git add src/components/tools/ocr-tool.tsx src/app/tools/ocr/page.tsx src/lib/tools/local-rapidocr.ts src/lib/tools/local-rapidocr.test.ts
git commit -m "feat: show local RapidOCR job progress"
\`\`\`

### Task 5: 回归与真实文件验收

**Files:**
- Modify: \`src/lib/tools/ocr-image.ts\`
- Modify: \`src/lib/tools/ocr-image.test.ts\`
- Modify: \`src/lib/tools/ai-tools-regression.test.ts\`
- Modify: \`src/lib/tools/unlimited-ocr.ts\`（只保留停用说明）

- [ ] **Step 1: 写入回归 RED 断言**

\`\`\`ts
assert.match(ocrHandler, /createLocalRapidOcrJobManager/)
assert.match(ocrPage, /本机 RapidOCR/)
assert.equal(ocrHandler.includes("recognizeUnlimitedOcrFile"), false)
assert.equal(ocrHandler.includes("recognizeLocalOcrFile"), false)
assert.match(extractHandler, /recognizeLocalOcrFile/)
\`\`\`

- [ ] **Step 2: 运行 RED 测试**

Run: \`npm test -- src/lib/tools/ai-tools-regression.test.ts src/lib/tools/ocr-image.test.ts\`

Expected: FAIL，当前 OCR 工具页仍断言 PaddleOCR。

- [ ] **Step 3: 完成回归修改**

在 \`ocr-image.ts\` 导出 100 页限制常量，保持现有图片格式和 50MB 限制。更新回归断言，确保 OCR 工具页已经切换 RapidOCR、没有百度调用；知识库资料导入保持原状，不在本次改变为异步流程。

- [ ] **Step 4: 完整验证**

Run: \`npm test\`

Expected: 所有测试 PASS。

Run: \`npm run build\`

Expected: EXIT 0。

Run: 在 \`http://localhost:3000/tools/ocr\` 上传一份不超过 100 页的真实扫描 PDF。

Expected: 页面显示页数进度，识别结束后可下载；人工核对关键标题、姓名与数字；低置信度页有提示。

- [ ] **Step 5: 提交与检查工作区**

\`\`\`bash
git add src/lib/tools/ocr-image.ts src/lib/tools/ocr-image.test.ts src/lib/tools/ai-tools-regression.test.ts src/lib/tools/unlimited-ocr.ts
git commit -m "test: cover RapidOCR offline workflow"
git status --short
\`\`\`

Expected: 只剩用户已有的三份未跟踪文档；不暂存、不修改它们。

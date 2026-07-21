# RapidOCR 本机后台任务设计

## 已确认目标

将 OCR 工具页面切换为 RapidOCR 的本机 CPU 识别：

- 不调用百度或其他云端 OCR API，不产生按次调用费用。
- 支持图片和扫描 PDF；PDF 单个文件最多 100 页、50MB。
- 长 PDF 作为后台任务运行，页面显示排队、识别进度、完成或失败状态，不再用一个 HTTP 请求等待全部结果。
- RapidOCR 引擎在本机常驻工作进程中只加载一次，任务按提交顺序逐个执行，避免多个 PDF 同时抢占 CPU 和内存。
- 识别完成后维持现有文本、Markdown、表格与下载能力。
- 运行环境、Python 包、模型、临时文件和任务文件均在 `E:\XMZAI\xmz-os\.local-ocr`，不写入 C 盘。

准确率不能以代码承诺为 100%。系统会使用 RapidOCR 返回的逐行置信度：当某一页存在低置信度文字时，在结果页提示该页需要人工核对。最终以用户提供的真实扫描 PDF 的关键字段核对结果作为验收依据。

## 方案选择

采用“Next.js 本机任务管理器 + 单个常驻 Python RapidOCR 工作进程”。

未采用的方案：

1. 单次 HTTP 请求同步等识别结果：100 页扫描 PDF 仍会被浏览器、代理或 Next.js 请求时限中断。
2. 每个任务启动一个 Python 进程：能运行但每次都加载模型，首屏等待长，也会让多个任务争抢本机 CPU。
3. 云端异步 OCR：吞吐量更高，但不满足免费、离线和不上传业务文件的约束。

## 架构与数据流

```text
浏览器选择图片或 PDF
        |
POST /api/tools/ocr
        |
本机任务管理器写入 .local-ocr/jobs/<任务ID>/input
        |
单个 RapidOCR Python 工作进程（模型只初始化一次）
  - 图片直接识别
  - PDF 先读取页数，超过 100 页则失败
  - 逐页 300 DPI 渲染、识别、发送进度和低置信度页信息
        |
任务管理器保存状态与结果 JSON
        |
GET /api/tools/ocr/<任务ID>（浏览器每秒轮询）
        |
完成：text / markdown / tableText / Word 下载数据
失败：用户可读错误与重试入口
```

任务状态为 `queued`、`running`、`completed`、`failed`。服务重启时，尚未完成的任务标记为失败，不会静默把同一份敏感文件再次提交；已完成结果可在清理窗口内继续读取。

## 文件职责

- `scripts/local-ocr/rapidocr-worker.py`：常驻 Python 工作进程；加载一次 RapidOCR，接收 JSON 行任务，逐页返回进度、文本、置信度与失败原因。
- `scripts/setup-local-rapidocr.ps1`：在 `.local-ocr\venv` 安装固定版本的 `rapidocr`、`onnxruntime` 与其依赖，设置所有缓存和临时目录到 E 盘，并运行 `rapidocr check` 验证。
- `src/lib/tools/local-rapidocr.ts`：Node.js 与工作进程通信、单任务队列、状态持久化、任务目录清理、进程异常和错误映射。
- `src/lib/tools/local-rapidocr.test.ts`：验证任务排队、100 页拒绝、进度更新、成功结果、低置信度页、工作进程异常、临时文件清理。
- `src/app/api/tools/ocr/route.ts` 与 `handler.ts`：提交 OCR 任务并立即返回任务 ID，不再同步等待 OCR 完成。
- `src/app/api/tools/ocr/[jobId]/route.ts`：按任务 ID 返回状态；完成时返回现有 OCR 输出结构。
- `src/components/tools/ocr-tool.tsx`：OCR 专用上传页组件；提交后轮询任务状态，展示“第 N / M 页”和低置信度提醒，复用现有输出下载格式。
- `src/app/tools/ocr/page.tsx`：改为使用 OCR 专用组件，并明确显示“本机 RapidOCR、最多 100 页”。
- `src/lib/tools/ocr-image.ts` 与测试：保持 50MB 上限并将 PDF 页数规则定义为 100 页（由工作进程实际检查）。

本次仅替换 `/tools/ocr` 工具页面。知识库资料导入保留现有稳定流程，避免将其同步导入接口改造成另一套异步交互；待 OCR 工具页用真实文件验证通过后，再单独决定是否复用此队列。

## 可靠性与隐私

- PDF 逐页渲染后立刻删除页图，任务完成或失败后删除原始文件与中间图像。
- 仅保留完成结果和状态文件供当前页面下载；新建任务或读取任务时清理超过两小时的终态任务目录。
- 工作进程退出、返回无效 JSON、结果为空、任务页数超过 100 页，均返回明确中文错误，且不暴露 Python stderr、路径或环境变量。
- 不读取、不使用百度密钥；已注释保留的百度客户端不从任何业务路径调用。

## 验收与测试

1. 单元测试先验证提交接口立即返回任务 ID；再验证状态接口依次返回排队、运行进度和完成结果。
2. 单元测试覆盖 PDF 第 101 页时失败、空文字、低置信度页、工作进程崩溃和任务目录清理。
3. 安装脚本在 E 盘环境中执行 `rapidocr check`，并对一张含中文和数字的图片得到非空结果。
4. 手工验证一份不超过 100 页的真实扫描 PDF：页面不显示“本机 OCR 识别失败”，进度递增，结果可下载，关键标题、姓名和数字与原件核对。
5. 运行 `npm test` 与 `npm run build`；确认 `.local-ocr` 不进入 Git，且不向 C 盘创建本方案的模型、缓存或临时文件。

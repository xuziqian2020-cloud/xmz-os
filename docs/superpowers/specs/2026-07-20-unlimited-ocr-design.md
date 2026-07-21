# Unlimited-OCR 接入设计

## 目标

将现有基于本地 Tesseract 的 OCR 识别切换为百度智能云文档解析（Unlimited-OCR），让 OCR 工具页支持图片和 PDF，并继续提供文本、Markdown、表格与 Word 导出。

## 范围

- OCR 工具页可上传现有图片格式和 PDF。
- 后端使用百度官方 Unlimited-OCR 的异步接口：换取 access token、提交文件、轮询任务、下载 Markdown 结果。
- 图片资料导入复用新识别服务，停止调用 Tesseract。
- 保留现有输出接口字段：`text`、`markdown`、`tableText`、`wordFile`。
- 不扩展资料导入的 PDF 解析策略；该流程继续优先使用现有 PDF 文本抽取逻辑。

## 不在范围内

- 不支持 Office 文档上传到 OCR 工具页。
- 不新增任务持久化、前端任务列表或后台回调处理。
- 不把百度凭据保存到浏览器、本地存储、数据库或源码。

## 方案选择

采用服务端在单个 OCR 请求中提交任务并轮询结果的方案。

选择理由：现有上传组件只处理一次请求—一次结果的交互，此方案可用最小改动保留现有页面和导出能力。服务端按百度建议每 5 秒查询状态，并限制总等待时间；超过上限则返回可读的超时错误，不伪造识别成功。

未采用的方案：

- 前端持有 `task_id` 并持续轮询：对长文档更稳，但需要新增客户端状态、API 协议和恢复机制，超出本次最小替换范围。
- 继续使用 Tesseract 作为兜底：会导致同一功能因环境不同产生不一致结果，也不符合“改用 Unlimited-OCR”的目标。

## 架构与数据流

```text
浏览器上传图片/PDF
        |
POST /api/tools/ocr
        |
Unlimited-OCR 服务模块
  1. 读取 BAIDU_OCR_API_KEY / BAIDU_OCR_SECRET_KEY
  2. 获取 access token
  3. 将文件 Base64 提交为任务
  4. 每 5 秒查询任务状态
  5. 下载 markdown_url
        |
构建 text / markdown / tableText / Word 响应
        |
现有 OCR 页面显示和下载
```

百度凭据仅在 Next.js Node.js 运行时读取。服务端向百度提交原始文件数据和原文件名；不会向前端返回 access token、任务 ID 或百度结果链接。

## 文件与职责

- `src/lib/tools/unlimited-ocr.ts`：百度鉴权、任务提交、轮询、下载结果和服务错误转换。
- `src/lib/tools/unlimited-ocr.test.ts`：覆盖 OAuth、异步状态、结果下载、超时与服务端错误。
- `src/lib/tools/ocr-image.ts`：新增 PDF 输入判定，保留图片输入兼容性。
- `src/lib/tools/ocr-image.test.ts`：增加 PDF 输入断言。
- `src/lib/tools/ocr-output.ts`：接收服务返回 Markdown，保留原始版式；生成可读纯文本、表格文本和 Word 文件。
- `src/lib/tools/ocr-output.test.ts`：验证 Markdown 表格不会在导出时丢失。
- `src/app/api/tools/ocr/route.ts`：校验图片/PDF，调用 Unlimited-OCR 服务并返回既有输出结构。
- `src/app/api/tools/extract-document/route.ts`：图片资料导入改为调用 Unlimited-OCR 服务。
- `src/app/tools/ocr/page.tsx`：上传说明与 `accept` 属性改为图片和 PDF。
- `src/lib/tools/ai-tools-regression.test.ts`：将 OCR 实现断言由 Tesseract 更新为 Unlimited-OCR。
- `package.json`、`package-lock.json`：移除不再使用的 `tesseract.js` 依赖。

## 错误处理

- 缺少任一百度环境变量：返回“尚未配置百度 Unlimited-OCR 凭据”。
- 文件不在允许格式或超过本地可安全提交的限制：在提交前返回 400，不发送文件。
- 百度接口返回 `error_code`：返回其可读错误信息，不暴露 token。
- 百度任务为 `failed`：返回 `task_error` 或服务错误信息。
- 到达总等待上限但任务仍未完成：返回“识别任务尚未完成，请稍后重试”。
- Markdown 下载失败或结果为空：返回“未获取到识别结果”。

## 测试与验收

- 单元测试验证百度 OAuth 参数、任务提交参数、5 秒轮询、成功 Markdown 下载、失败状态、超时和凭据缺失。
- 输入测试验证 JPG/PNG 等现有图片格式和 PDF 都被 OCR 接口接受，非图片/非 PDF 仍被拒绝。
- 输出测试验证服务 Markdown 中的表格结构保留在 Markdown 下载，并生成可编辑 Word 文件。
- 回归测试确认 OCR 路由和资料导入不再引用 Tesseract。
- 执行 `npm test`、`npm run build` 与针对新增模块的测试命令。

## 部署前置条件

在部署环境配置以下变量，并在百度智能云开通 Unlimited-OCR 服务：

```text
BAIDU_OCR_API_KEY=...
BAIDU_OCR_SECRET_KEY=...
```

密钥由部署管理员配置，不能粘贴到仓库、测试文件或前端请求中。

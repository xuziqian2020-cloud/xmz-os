# 本机 PaddleOCR 设计

## 目标

将 OCR 页面和知识库图片抽取切换到 Windows 本机 PaddleOCR，支持清晰扫描图片与扫描 PDF，不访问任何云端 OCR 接口，不产生云端 OCR 调用费用。

本方案不承诺所有文件 100% 准确；以用户提供的清晰扫描样本核对关键文本作为验收标准。

## 运行目录

所有新增运行文件均存放在 E 盘的项目目录下：

- `E:\XMZAI\xmz-os\.local-ocr\venv`：Python 虚拟环境。
- `E:\XMZAI\xmz-os\.local-ocr\models`：PaddleOCR 本地模型。
- `E:\XMZAI\xmz-os\.local-ocr\pip-cache`：Python 安装缓存。
- `E:\XMZAI\xmz-os\.local-ocr\temp`：单次 PDF 页面渲染临时文件。

安装和运行时显式设置 `PIP_CACHE_DIR`、`PADDLE_OCR_BASE_DIR`、`TEMP`、`TMP` 到以上目录，避免包、模型或临时 PDF 页面写入 C 盘。虚拟环境基于现有的 `E:\PythonDev\python.exe` 创建。

## 架构与数据流

1. 新增 Python 入口脚本，只接收文件路径和输出路径。
2. 图片直接交给 PaddleOCR 的中文高精度模型识别；扫描 PDF 先用 PyMuPDF 以 300 DPI 渲染为页面图片，再逐页识别。
3. Python 脚本将页面文本写为 UTF-8 JSON，Node.js 包装器读取 JSON 并返回纯文本。
4. `/api/tools/ocr` 调用本地包装器，再复用现有文本、Markdown、表格、Word 下载组装逻辑。
5. `/api/tools/extract-document` 的图片分支调用同一包装器；PDF 先保留现有 `pdf-parse` 文本层抽取，只有抽取结果为空时才走本机 PaddleOCR。

本机包装器必须设定单次执行超时，并将 Python、模型、PDF 渲染失败统一映射为固定中文错误，不回退到百度或其他云端服务。

## 百度停用策略

- 保留 `src/lib/tools/unlimited-ocr.ts`，在文件头明确标记“已停用，不可从业务路由调用”。
- 移除 OCR 路由和文档抽取路由对百度客户端的所有导入与调用。
- 注释或移除百度客户端的回归测试，新增断言确保业务路由不再引用百度客户端。
- 删除当前 `.env.local` 中的百度凭据；该文件不进入 Git。

## 依赖与安装策略

- 在 E 盘虚拟环境内安装 CPU 版 PaddlePaddle、PaddleOCR 和 PyMuPDF。
- 将安装后实际解析出的精确版本写入 `.local-ocr/requirements.txt`，使同一台机器可重复修复环境。
- 首次安装可联网下载 Python 包与模型；识别时只读取本机模型，不发送待识别文件到第三方服务。
- 不新增付费 API、账号、密钥或按量计费组件。

## 测试与验收

1. 单元测试覆盖本机命令参数、超时、无效 JSON、空文本和固定错误映射。
2. 路由回归测试确认 OCR 页面和文档图片抽取不再导入或调用百度客户端。
3. PDF 测试确认有文字层的 PDF 保持 `pdf-parse` 优先，扫描 PDF 可调用本机 OCR 回退路径。
4. 安装完成后用用户的一份清晰扫描样本人工核对：输出非空、中文不乱码、关键标题、姓名、数字与原件一致。
5. 运行项目全量测试与生产构建；验证 `.local-ocr` 不被 Git 跟踪，且 C 盘未新增本方案运行目录。

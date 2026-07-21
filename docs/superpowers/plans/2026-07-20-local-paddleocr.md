# Local PaddleOCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 OCR 页面和图片/扫描 PDF 文档抽取切换为本机 PaddleOCR，避免云端 OCR 调用费用且不把运行库、模型或临时文件写入 C 盘。

**Architecture:** Node.js 包装器在 `E:\XMZAI\xmz-os\.local-ocr` 创建临时任务并启动 E 盘虚拟环境中的 Python 脚本。脚本用 PaddleOCR 识别图片，用 PyMuPDF 将扫描 PDF 按 300 DPI 转成页面图片后识别，输出 UTF-8 JSON；业务路由只调用该包装器，百度客户端保留但不再被导入。

**Tech Stack:** Next.js 13、TypeScript、Node child_process、Python 3.10（`E:\PythonDev\python.exe`）、PaddlePaddle CPU、PaddleOCR、PyMuPDF、Node test runner。

---

## 文件边界

- `scripts/setup-local-paddleocr.ps1`：仅负责在 E 盘创建虚拟环境、安装依赖和写入本机 requirements。
- `scripts/local-ocr/recognize.py`：仅负责图片/PDF 到 UTF-8 JSON 文本。
- `src/lib/tools/local-paddle-ocr.ts`：仅负责 Node 临时文件、Python 子进程、超时、JSON 和清理。
- 现有两个业务路由：仅负责上传校验、固定错误映射和下载结果复用。

### Task 1: 固定 E 盘运行目录并完成安装脚本

**Files:**
- Create: `src/lib/tools/local-paddle-ocr.ts`
- Create: `src/lib/tools/local-paddle-ocr.test.ts`
- Create: `scripts/setup-local-paddleocr.ps1`
- Modify: `.gitignore`

- [ ] **Step 1: 先写失败的运行目录测试**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getLocalOcrPaths } from "./local-paddle-ocr"

describe("本机 PaddleOCR 目录", () => {
  it("所有本机运行文件均在 E 盘项目目录", () => {
    const paths = getLocalOcrPaths("E:\\XMZAI\\xmz-os")
    assert.equal(paths.root, "E:\\XMZAI\\xmz-os\\.local-ocr")
    assert.equal(paths.python, "E:\\XMZAI\\xmz-os\\.local-ocr\\venv\\Scripts\\python.exe")
    assert.equal(paths.models, "E:\\XMZAI\\xmz-os\\.local-ocr\\models")
    assert.equal(paths.temp, "E:\\XMZAI\\xmz-os\\.local-ocr\\temp")
  })
})
```

- [ ] **Step 2: 验证测试确实失败**

Run: `npm test -- src/lib/tools/local-paddle-ocr.test.ts`

Expected: FAIL，原因是 `local-paddle-ocr.ts` 不存在。

- [ ] **Step 3: 实现最小路径契约**

```ts
import path from "node:path"

export type LocalOcrPaths = { root: string; python: string; models: string; pipCache: string; temp: string }
export type ProcessResult = { code: number; stdout: string; stderr: string }
export type LocalOcrDependencies = {
  projectRoot?: string
  runProcess?: (command: string, args: string[]) => Promise<ProcessResult>
}

// XMZADD 20260720 统一计算 E 盘本机 PaddleOCR 目录，避免运行库和模型写入 C 盘。
export function getLocalOcrPaths(projectRoot = process.cwd()): LocalOcrPaths {
  const root = path.join(projectRoot, ".local-ocr")
  return {
    root,
    python: path.join(root, "venv", "Scripts", "python.exe"),
    models: path.join(root, "models"),
    pipCache: path.join(root, "pip-cache"),
    temp: path.join(root, "temp"),
  }
}
```

Add `.local-ocr/` to `.gitignore`.

- [ ] **Step 4: 创建 E 盘安装脚本**

```powershell
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$ocrRoot = Join-Path $projectRoot '.local-ocr'
$venv = Join-Path $ocrRoot 'venv'
$python = Join-Path $venv 'Scripts\python.exe'
$env:PIP_CACHE_DIR = Join-Path $ocrRoot 'pip-cache'
$env:TEMP = Join-Path $ocrRoot 'temp'
$env:TMP = $env:TEMP
$env:HOME = $ocrRoot
$env:USERPROFILE = $ocrRoot
$env:PADDLE_OCR_BASE_DIR = Join-Path $ocrRoot 'models'
New-Item -ItemType Directory -Force -Path $ocrRoot, $env:PIP_CACHE_DIR, $env:TEMP, $env:PADDLE_OCR_BASE_DIR | Out-Null
if (-not (Test-Path -LiteralPath $python)) { & 'E:\PythonDev\python.exe' -m venv $venv }
& $python -m pip install --upgrade pip
& $python -m pip install paddlepaddle paddleocr pymupdf
& $python -m pip freeze | Set-Content -LiteralPath (Join-Path $ocrRoot 'requirements.txt') -Encoding utf8
& $python -c "import fitz, paddle, paddleocr; print('PaddleOCR local runtime ready')"
```

- [ ] **Step 5: 验证并提交安装基础**

Run:

```powershell
npm test -- src/lib/tools/local-paddle-ocr.test.ts
powershell -ExecutionPolicy Bypass -File scripts/setup-local-paddleocr.ps1
Test-Path -LiteralPath 'E:\XMZAI\xmz-os\.local-ocr\venv\Scripts\python.exe'
```

Expected: 测试通过、安装命令输出 `PaddleOCR local runtime ready`、最后一行是 `True`。

```bash
git add .gitignore scripts/setup-local-paddleocr.ps1 src/lib/tools/local-paddle-ocr.ts src/lib/tools/local-paddle-ocr.test.ts
git commit -m "feat: add E drive PaddleOCR runtime"
```

### Task 2: 实现离线 Python 识别器和 Node 包装器

**Files:**
- Create: `scripts/local-ocr/recognize.py`
- Create: `scripts/local-ocr/recognize.test.py`
- Modify: `src/lib/tools/local-paddle-ocr.ts`
- Modify: `src/lib/tools/local-paddle-ocr.test.ts`

- [ ] **Step 1: 编写失败的 Python 文本提取测试**

```python
import unittest
from recognize import collect_texts

class CollectTextsTest(unittest.TestCase):
    def test_keeps_non_blank_recognized_text(self):
        self.assertEqual(collect_texts({"res": {"rec_texts": ["标题", "", "合同编号 1001"]}}), "标题\n合同编号 1001")

    def test_returns_empty_when_result_has_no_text(self):
        self.assertEqual(collect_texts({"res": {"rec_texts": []}}), "")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 验证 Python 测试失败**

Run: `E:\XMZAI\xmz-os\.local-ocr\venv\Scripts\python.exe scripts/local-ocr/recognize.test.py`

Expected: FAIL，原因是 `recognize.py` 不存在。

- [ ] **Step 3: 实现图片和扫描 PDF 识别**

```python
import argparse
import json
from pathlib import Path
import fitz
from paddleocr import PaddleOCR

def collect_texts(payload):
    values = payload.get("res", {}).get("rec_texts", [])
    return "\n".join(str(value).strip() for value in values if str(value).strip())

def page_paths(input_path, temp_dir):
    source = Path(input_path)
    if source.suffix.lower() != ".pdf":
        return [source]
    document = fitz.open(source)
    matrix = fitz.Matrix(300 / 72, 300 / 72)
    pages = []
    for index, page in enumerate(document):
        output = Path(temp_dir) / f"page-{index + 1}.png"
        page.get_pixmap(matrix=matrix, alpha=False).save(output)
        pages.append(output)
    return pages

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--temp-dir", required=True)
    args = parser.parse_args()
    Path(args.temp_dir).mkdir(parents=True, exist_ok=True)
    ocr = PaddleOCR(lang="ch", device="cpu", use_doc_orientation_classify=True, use_doc_unwarping=False, use_textline_orientation=True)
    pages = []
    for input_page in page_paths(args.input, args.temp_dir):
        lines = []
        for result in ocr.predict(str(input_page)):
            payload = json.loads(result.json) if isinstance(result.json, str) else result.json
            text = collect_texts(payload)
            if text:
                lines.append(text)
        if lines:
            pages.append("\n".join(lines))
    Path(args.output).write_text(json.dumps({"text": "\n\n".join(pages)}, ensure_ascii=False), encoding="utf-8")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: 先为 Node 包装器写失败测试**

```ts
import { writeFile } from "node:fs/promises"

it("读取 Python 产生的 UTF-8 JSON", async () => {
  const text = await recognizeLocalOcrFile(
    { fileName: "scan.png", buffer: Buffer.from("image") },
    {
      projectRoot: "E:\\XMZAI\\xmz-os",
      runProcess: async (_command, args) => {
        const outputPath = args[args.indexOf("--output") + 1]
        await writeFile(outputPath, "{\"text\":\"合同编号 1001\"}", "utf8")
        return { code: 0, stdout: "", stderr: "" }
      },
    },
  )
  assert.equal(text, "合同编号 1001")
})

it("Python 失败时不泄漏 stderr", async () => {
  await assert.rejects(
    () => recognizeLocalOcrFile({ fileName: "scan.png", buffer: Buffer.from("image") }, { projectRoot: "E:\\XMZAI\\xmz-os", runProcess: async () => ({ code: 1, stdout: "", stderr: "internal path" }) }),
    /本机 OCR 识别失败，请检查本机运行环境/,
  )
})
```

- [ ] **Step 5: 实现 120 秒超时、JSON 读取和任务清理**

`recognizeLocalOcrFile` 必须：检查 `paths.python`；先执行 `mkdir(paths.temp, { recursive: true })`；以 `mkdtemp(path.join(paths.temp, "job-"))` 创建任务目录；把上传内容写成 `input` 加原扩展名；以 `spawn(paths.python, [scriptPath, "--input", inputPath, "--output", outputPath, "--temp-dir", jobRoot], { windowsHide: true, env })` 执行；120 秒超时后终止子进程；只从 `result.json` 读取 `{ text: string }`；无文本抛出 422；进程/JSON/文件错误抛出固定 502；在 `finally` 中执行 `rm(jobRoot, { recursive: true, force: true })`。

环境对象必须把 `PIP_CACHE_DIR`、`PADDLE_OCR_BASE_DIR`、`TEMP`、`TMP`、`HOME`、`USERPROFILE` 全部设为 Task 1 的 E 盘目录。

- [ ] **Step 6: 验证识别器并提交**

Run:

```powershell
E:\XMZAI\xmz-os\.local-ocr\venv\Scripts\python.exe scripts/local-ocr/recognize.test.py
npm test -- src/lib/tools/local-paddle-ocr.test.ts
```

Expected: Python 两项测试和 Node 包装器测试均通过。

```bash
git add scripts/local-ocr/recognize.py scripts/local-ocr/recognize.test.py src/lib/tools/local-paddle-ocr.ts src/lib/tools/local-paddle-ocr.test.ts
git commit -m "feat: add offline PaddleOCR recognizer"
```

### Task 3: 切换业务路由并停用百度

**Files:**
- Modify: `src/app/api/tools/ocr/route.ts`
- Modify: `src/app/api/tools/extract-document/route.ts`
- Modify: `src/app/tools/ocr/page.tsx`
- Modify: `src/lib/tools/ai-tools-regression.test.ts`
- Modify: `src/lib/tools/unlimited-ocr.ts`
- Modify: `src/lib/tools/unlimited-ocr.test.ts`

- [ ] **Step 1: 先改写为失败的路由回归断言**

```ts
assert.match(route, /recognizeLocalOcrFile/)
assert.match(extractRoute, /recognizeLocalOcrFile/)
assert.equal(route.includes("recognizeUnlimitedOcrFile"), false)
assert.equal(extractRoute.includes("recognizeUnlimitedOcrFile"), false)
assert.match(page, /本机 PaddleOCR/)
```

- [ ] **Step 2: 验证断言失败**

Run: `npm test -- src/lib/tools/ai-tools-regression.test.ts`

Expected: FAIL，当前两个路由仍调用百度客户端。

- [ ] **Step 3: 用本机包装器替换所有活动调用**

两个路由改为导入：

```ts
import { LocalOcrError, recognizeLocalOcrFile } from "@/lib/tools/local-paddle-ocr"
```

主 OCR 路由调用 `recognizeLocalOcrFile({ fileName: file.name, buffer: Buffer.from(await file.arrayBuffer()) })`，再调用现有 `buildOcrResultPayload(file.name, text)`；只把 `LocalOcrError` 的固定中文文案和状态返回客户端。

文档抽取路由：图片直接调用本机包装器；PDF 先运行已有 `pdf-parse`，当结果为空时再调用本机包装器。不得删除文本层 PDF 的快速路径。

页面描述改为：`上传图片或 PDF 后，使用本机 PaddleOCR 离线识别文字，不产生云端 OCR 调用费用。`

给 `unlimited-ocr.ts` 增加文件头注释：`XMZADD 20260720 百度 Unlimited-OCR 已停用，仅为后续恢复保留，业务路由不得导入或调用。`。删除其活动测试并改为断言业务路由不再引用该模块。

- [ ] **Step 4: 跑回归测试并提交切换**

Run:

```powershell
npm test -- src/lib/tools/ai-tools-regression.test.ts src/lib/tools/ocr-image.test.ts src/lib/tools/ocr-output.test.ts src/lib/tools/local-paddle-ocr.test.ts
```

Expected: 所有选择的测试通过，源码断言确认业务路由没有百度调用。

```bash
git add src/app/api/tools/ocr/route.ts src/app/api/tools/extract-document/route.ts src/app/tools/ocr/page.tsx src/lib/tools/ai-tools-regression.test.ts src/lib/tools/unlimited-ocr.ts src/lib/tools/unlimited-ocr.test.ts
git commit -m "feat: use local PaddleOCR for OCR routes"
```

### Task 4: 删除百度凭据并完成离线验收

**Files:**
- Modify locally only: `.env.local`
- Create locally only: `.local-ocr/requirements.txt`

- [ ] **Step 1: 删除本机百度密钥**

从 `.env.local` 删除 `BAIDU_OCR_API_KEY` 和 `BAIDU_OCR_SECRET_KEY`，不得打印、暂存或提交该文件。

- [ ] **Step 2: 做无云端凭据的自动验证**

Run:

```powershell
npm test
npm run build
Test-Path -LiteralPath 'E:\XMZAI\xmz-os\.local-ocr\requirements.txt'
```

Expected: 全量测试通过、生产构建通过、最后一项为 `True`。

- [ ] **Step 3: 做本机服务冒烟验证**

Run: `npm run start -- -p 3000`

Upload a clear scan image or scanned PDF to `http://localhost:3000/tools/ocr`.

Expected: 返回非空中文文本，Markdown/表格/Word 下载仍可使用，且路由不访问 `aip.baidubce.com`。

- [ ] **Step 4: 做用户样本准确率验收**

请用户上传一份代表性的清晰扫描图片或扫描 PDF；人工核对输出中的标题、姓名和数字。若关键字段不一致，只允许调整本机模型或预处理，不得恢复云端 OCR；重新运行 Task 4 的自动测试和服务冒烟验证。

- [ ] **Step 5: 最终提交和工作区检查**

```bash
git status --short
git add .gitignore scripts/setup-local-paddleocr.ps1 scripts/local-ocr src/lib/tools/local-paddle-ocr.ts src/lib/tools/local-paddle-ocr.test.ts src/app/api/tools/ocr/route.ts src/app/api/tools/extract-document/route.ts src/app/tools/ocr/page.tsx src/lib/tools/ai-tools-regression.test.ts src/lib/tools/unlimited-ocr.ts src/lib/tools/unlimited-ocr.test.ts
git commit -m "test: verify offline PaddleOCR workflow"
```

Expected: `.env.local` 与 `.local-ocr/` 不出现在 Git 暂存内容；提交中不包含密钥、模型、缓存或临时 PDF 页面图片。

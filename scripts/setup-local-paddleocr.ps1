param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$pathTrimChars = [char[]]@("\", "/")
$expectedProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..")).TrimEnd($pathTrimChars)
$resolvedProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd($pathTrimChars)

if (-not [string]::Equals($resolvedProjectRoot, $expectedProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "ProjectRoot 必须是当前项目根目录：$expectedProjectRoot"
}

$runtimeRoot = Join-Path $resolvedProjectRoot ".local-ocr"
$venvRoot = Join-Path $runtimeRoot "venv"
$pythonPath = Join-Path $venvRoot "Scripts\python.exe"
$modelsPath = Join-Path $runtimeRoot "models"
$pipCachePath = Join-Path $runtimeRoot "pip-cache"
$tempPath = Join-Path $runtimeRoot "temp"
$homePath = Join-Path $runtimeRoot "home"
$pythonUserBasePath = Join-Path $runtimeRoot "python-user"
$requirementsPath = Join-Path $runtimeRoot "requirements.txt"
$basePythonPath = "E:\PythonDev\python.exe"

foreach ($path in @($runtimeRoot, $modelsPath, $pipCachePath, $tempPath, $homePath, $pythonUserBasePath)) {
  $resolvedPath = [System.IO.Path]::GetFullPath($path)
  if (-not $resolvedPath.StartsWith($runtimeRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -and -not [string]::Equals($resolvedPath, $runtimeRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "本机 OCR 运行目录必须位于 $runtimeRoot：$resolvedPath"
  }

  New-Item -ItemType Directory -Force -Path $resolvedPath | Out-Null
}

if (-not (Test-Path -LiteralPath $basePythonPath -PathType Leaf)) {
  throw "未找到基础 Python：$basePythonPath"
}

# 用项目磁盘上的目录承载缓存、临时文件和模型，避免安装过程写入用户 C 盘目录。
$env:PIP_CACHE_DIR = $pipCachePath
$env:TEMP = $tempPath
$env:TMP = $tempPath
$env:HOME = $homePath
$env:USERPROFILE = $homePath
$env:PYTHONUSERBASE = $pythonUserBasePath
$env:PYTHONPYCACHEPREFIX = (Join-Path $tempPath "pycache")
$env:PADDLE_OCR_BASE_DIR = $modelsPath
$env:PIP_DISABLE_PIP_VERSION_CHECK = "1"
$env:PIP_NO_INPUT = "1"

# 将第三方工具的相对缓存也限制在本机 OCR 目录，避免在项目根目录产生安装残留。
Set-Location -LiteralPath $runtimeRoot

if (-not (Test-Path -LiteralPath $pythonPath -PathType Leaf)) {
  & $basePythonPath -m venv $venvRoot
  if ($LASTEXITCODE -ne 0) {
    throw "创建本机 PaddleOCR 虚拟环境失败，退出码：$LASTEXITCODE"
  }
}

& $pythonPath -m pip install --cache-dir $pipCachePath --upgrade pip
if ($LASTEXITCODE -ne 0) {
  throw "升级本机 PaddleOCR 虚拟环境的 pip 失败，退出码：$LASTEXITCODE"
}

& $pythonPath -m pip install --cache-dir $pipCachePath paddlepaddle paddleocr pymupdf
if ($LASTEXITCODE -ne 0) {
  throw "安装 PaddleOCR 运行库失败，退出码：$LASTEXITCODE"
}

& $pythonPath -m pip freeze | Out-File -LiteralPath $requirementsPath -Encoding utf8
if ($LASTEXITCODE -ne 0) {
  throw "生成本机 PaddleOCR 依赖清单失败，退出码：$LASTEXITCODE"
}

& $pythonPath -c "import fitz, paddle, paddleocr; print('PaddleOCR runtime verified')"
if ($LASTEXITCODE -ne 0) {
  throw "验证本机 PaddleOCR 运行库失败，退出码：$LASTEXITCODE"
}

Write-Host "本机 PaddleOCR 运行库已验证：$runtimeRoot"

[CmdletBinding()]
param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$localOcrRoot = Join-Path $ProjectRoot ".local-ocr"
$python = Join-Path $localOcrRoot "venv\Scripts\python.exe"
$rapidOcrCli = Join-Path $localOcrRoot "venv\Scripts\rapidocr.exe"
$pipCache = Join-Path $localOcrRoot "pip-cache"
$temp = Join-Path $localOcrRoot "temp"
$localHome = Join-Path $localOcrRoot "home"

if (-not (Test-Path -LiteralPath $python)) {
  throw "未找到 E 盘本机 Python 环境：$python"
}

New-Item -ItemType Directory -Force -Path $pipCache, $temp, $localHome | Out-Null
$env:PIP_CACHE_DIR = $pipCache
$env:PIP_DISABLE_PIP_VERSION_CHECK = "1"
$env:TEMP = $temp
$env:TMP = $temp
$env:HOME = $localHome
$env:USERPROFILE = $localHome
$env:PYTHONUSERBASE = Join-Path $localOcrRoot "python-user"
$env:PYTHONPYCACHEPREFIX = Join-Path $temp "pycache"

& $python -m pip install --upgrade rapidocr onnxruntime
if ($LASTEXITCODE -ne 0) {
  throw "RapidOCR 安装失败"
}

& $rapidOcrCli check
if ($LASTEXITCODE -ne 0) {
  throw "RapidOCR 本机自检失败"
}

& $python -m pip freeze | Set-Content -LiteralPath (Join-Path $localOcrRoot "requirements-rapidocr.txt") -Encoding utf8

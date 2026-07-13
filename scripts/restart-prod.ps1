param(
    [int]$Port = 3100
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\')
$NodePath = 'E:\XMZAI\.tools\node20\node.exe'
$NextBin = Join-Path $ProjectRoot 'node_modules\next\dist\bin\next'
$OutLog = Join-Path $ProjectRoot '.next-start.out.log'
$ErrLog = Join-Path $ProjectRoot '.next-start.err.log'
$PidFile = Join-Path $ProjectRoot '.next-start.pid'
$PortFile = Join-Path $ProjectRoot '.next-start.port'

if (-not (Test-Path -LiteralPath $NodePath)) {
    $NodeCommand = (Get-Command node -ErrorAction Stop).Source
} else {
    $NodeCommand = $NodePath
}

if (-not (Test-Path -LiteralPath $NextBin)) {
    throw "Next.js binary was not found. Run npm install first."
}

Set-Location -LiteralPath $ProjectRoot

Write-Host "Project: $ProjectRoot"
Write-Host "Node: $NodeCommand"
Write-Host "Port: $Port"

$CurrentProcessId = [System.Diagnostics.Process]::GetCurrentProcess().Id

if (Test-Path -LiteralPath $PidFile) {
    $KnownPidText = (Get-Content -LiteralPath $PidFile -Raw).Trim()
    $KnownPid = 0
    if ([int]::TryParse($KnownPidText, [ref]$KnownPid) -and $KnownPid -gt 0 -and $KnownPid -ne $CurrentProcessId) {
        $KnownProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $KnownPid" -ErrorAction SilentlyContinue
        if ($KnownProcess -and $KnownProcess.Name -like 'node*') {
            Write-Host "Stopping previous server process $KnownPid"
            Stop-Process -Id $KnownPid -Force -ErrorAction SilentlyContinue
        }
    }
}

$ProjectNodeProcesses = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -like 'node*' -and
    $_.ProcessId -ne $CurrentProcessId -and
    $_.CommandLine -and
    $_.CommandLine -like "*$ProjectRoot*" -and
    (
        $_.CommandLine -like '*node_modules\next*' -or
        $_.CommandLine -like '*next dev*' -or
        $_.CommandLine -like '*next start*' -or
        $_.CommandLine -like '*npm-cli.js*run*dev*' -or
        $_.CommandLine -like '*npm-cli.js*run*start*'
    )
}

foreach ($ProcessInfo in $ProjectNodeProcesses) {
    Write-Host "Stopping project Next process $($ProcessInfo.ProcessId)"
    Stop-Process -Id $ProcessInfo.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 800

$NextDir = Join-Path $ProjectRoot '.next'
if (Test-Path -LiteralPath $NextDir) {
    $ResolvedNextDir = (Resolve-Path -LiteralPath $NextDir).Path
    if (-not $ResolvedNextDir.StartsWith($ProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove .next outside the project root."
    }

    Write-Host "Removing stale .next"
    Remove-Item -LiteralPath $ResolvedNextDir -Recurse -Force
}

Write-Host "Building production bundle"
& $NodeCommand $NextBin build
if ($LASTEXITCODE -ne 0) {
    throw "next build failed."
}

foreach ($LogPath in @($OutLog, $ErrLog)) {
    if (Test-Path -LiteralPath $LogPath) {
        Clear-Content -LiteralPath $LogPath
    } else {
        New-Item -ItemType File -Path $LogPath | Out-Null
    }
}

Write-Host "Starting production server"
$StartedProcess = Start-Process `
    -FilePath $NodeCommand `
    -ArgumentList @($NextBin, 'start', '-p', [string]$Port) `
    -WorkingDirectory $ProjectRoot `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -PassThru `
    -WindowStyle Hidden

Set-Content -LiteralPath $PidFile -Value $StartedProcess.Id -Encoding ASCII
Set-Content -LiteralPath $PortFile -Value $Port -Encoding ASCII

$HealthUrl = "http://localhost:$Port/login"
$Healthy = $false
for ($Index = 1; $Index -le 20; $Index++) {
    Start-Sleep -Seconds 1

    try {
        $Response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 5
        if ($Response.StatusCode -eq 200) {
            $Healthy = $true
            break
        }
    } catch {
        if ($Index -eq 20) {
            throw
        }
    }
}

if (-not $Healthy) {
    throw "Production server did not pass the health check."
}

if ((Test-Path -LiteralPath $ErrLog) -and ((Get-Item -LiteralPath $ErrLog).Length -gt 0)) {
    Write-Host "Server started, but stderr is not empty:"
    Get-Content -LiteralPath $ErrLog -Tail 40
} else {
    Write-Host "Server stderr is empty."
}

Write-Host "Ready: http://localhost:$Port"

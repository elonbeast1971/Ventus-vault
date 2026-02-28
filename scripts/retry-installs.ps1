<#
Retry installs for services that previously failed.

Usage:
  # Retry just the services that failed earlier (default)
  powershell -ExecutionPolicy Bypass -File .\scripts\retry-installs.ps1

  # Retry installations for all services
  powershell -ExecutionPolicy Bypass -File .\scripts\retry-installs.ps1 -All

This script prefers `npm.cmd` to avoid PowerShell execution policy issues.
#>
param(
    [switch]$All
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Split-Path -Parent $scriptDir
Set-Location $root

$defaultTargets = @(
    "services\wallet-service",
    "services\transaction-service",
    "services\notification-service"
)

$allTargets = @(
    "services\api-gateway",
    "services\auth-service",
    "services\wallet-service",
    "services\transaction-service",
    "services\rate-service",
    "services\notification-service",
    "services\payments-service",
    "services\ai-engine",
    "frontend"
)

$targets = if ($All) { $allTargets } else { $defaultTargets }

function Invoke-NpmInstall($path) {
    if (-not (Test-Path $path)) { Write-Host "Missing path: $path"; return }
    Write-Host "Installing npm dependencies in $path..."
    Push-Location $path
    try {
        if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
            Write-Host "Using npm.cmd"
            & npm.cmd install
        } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
            & npm install
        } else {
            Write-Warning "npm not found in PATH; skipping $path"
        }
    } catch {
        Write-Warning ("npm install failed in {0}: {1}" -f $path, $_)
    }
    Pop-Location
}

function Invoke-PipInstall($path) {
    if (-not (Test-Path $path)) { Write-Host "Missing path: $path"; return }
    $req = Join-Path $path 'requirements.txt'
    if (-not (Test-Path $req)) { Write-Host "No requirements.txt in $path; skipping"; return }
    Write-Host "Installing Python requirements in $path..."
    Push-Location $path
    try {
        if (Get-Command pip -ErrorAction SilentlyContinue) { $pipCmd = 'pip' } else { $pipCmd = 'pip3' }
        & $pipCmd install -r requirements.txt
    } catch {
        Write-Warning ("pip install failed in {0}: {1}" -f $path, $_)
    }
    Pop-Location
}

foreach ($t in $targets) {
    $p = Join-Path $root $t
    if (Test-Path (Join-Path $p 'package.json')) {
        Run-NpmInstall $p
    }
    if (Test-Path (Join-Path $p 'requirements.txt')) {
        Run-PipInstall $p
    }
}

Write-Host "\nRetry installs finished. If any installs still fail, paste the npm error logs here and I'll help fix dependency issues."
<#
One-time setup script for VentusVault.

Usage (from repo root):
  powershell -ExecutionPolicy Bypass -File .\scripts\setup-venus-vault.ps1

What it does:
- Installs Node (npm) dependencies for each service that has package.json
- Installs Python requirements for services that have requirements.txt
- Copies .env.example -> .env when present
- Creates two run shims at the repo root: `Venus-vault.ps1` and `Venus-vault.cmd`
  which invoke the existing `scripts/start-full-stack.ps1` to start everything.

This script is idempotent and safe to re-run.
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Split-Path -Parent $scriptDir
Set-Location $root

Write-Host "Running VentusVault one-time setup in: $root"

function Check-Command($cmd) {
    try {
        Get-Command $cmd -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

$hasNode = Check-Command 'node'
$hasNpm = Check-Command 'npm'
$hasPip = Check-Command 'pip' -or Check-Command 'pip3'

if (-not $hasNode -or -not $hasNpm) {
    Write-Warning "Node.js and npm were not both detected. Please install Node.js (includes npm) to proceed."
}
if (-not $hasPip) {
    Write-Warning "pip not found. Python requirements will be skipped unless pip is available."
}

$services = @(
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

foreach ($s in $services) {
    $path = Join-Path $root $s
    if (-not (Test-Path $path)) { Write-Host "Skipping missing: $s"; continue }
    Write-Host "\n=== Processing $s ==="
    if (Test-Path (Join-Path $path 'package.json')) {
        if ($hasNpm) {
                Write-Host "Installing npm dependencies in $s..."
                Push-Location $path
                try {
                    if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
                        Write-Host "Using npm.cmd to avoid execution policy issues"
                        & npm.cmd install
                    } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
                        & npm install
                    } else {
                        Write-Warning "npm not found in PATH; skipping npm install for $s"
                    }
                } catch { Write-Warning ("npm install failed in {0}: {1}" -f $s, $_) }
                Pop-Location
        } else {
            Write-Warning "npm not available; skipping npm install for $s"
        }
    }
    if (Test-Path (Join-Path $path 'requirements.txt')) {
        if ($hasPip) {
            Write-Host "Installing Python requirements in $s..."
            Push-Location $path
            if (Get-Command pip -ErrorAction SilentlyContinue) { $pipCmd = 'pip' } else { $pipCmd = 'pip3' }
            try { & $pipCmd install -r requirements.txt } catch { Write-Warning ("pip install failed in {0}: {1}" -f $s, $_) }
            Pop-Location
        } else {
            Write-Warning "pip not available; skipping Python deps for $s"
        }
    }

    # copy .env.example -> .env if present
    $example = Join-Path $path '.env.example'
    $dest = Join-Path $path '.env'
    if (Test-Path $example) {
        if (-not (Test-Path $dest)) {
            Copy-Item $example $dest
            Write-Host "Created $s\.env from .env.example"
        }
    }
}

# Create run shim scripts at repo root
$psShim1 = Join-Path $root 'Venus-vault.ps1'
$cmdShim1 = Join-Path $root 'Venus-vault.cmd'
$psShim2 = Join-Path $root 'Ventus-vault.ps1'
$cmdShim2 = Join-Path $root 'Ventus-vault.cmd'
$startScript = Join-Path $root 'scripts\start-full-stack.ps1'

$psContent = @"
# launch shim - calls the start-full-stack helper
param(
    [switch]$Force
)
powershell -ExecutionPolicy Bypass -NoExit -File `"$startScript`"
"@

$cmdContent = @"
@echo off
powershell -ExecutionPolicy Bypass -NoExit -File "%~dp0scripts\start-full-stack.ps1"
"@

try {
    Set-Content -Path $psShim1 -Value $psContent -Force -Encoding UTF8
    Set-Content -Path $cmdShim1 -Value $cmdContent -Force -Encoding UTF8
    Set-Content -Path $psShim2 -Value $psContent -Force -Encoding UTF8
    Set-Content -Path $cmdShim2 -Value $cmdContent -Force -Encoding UTF8
    Write-Host "Created run shims: Venus-vault.ps1, Venus-vault.cmd, Ventus-vault.ps1 and Ventus-vault.cmd"
} catch {
    Write-Warning "Failed to create run shims: $_"
}

Write-Host "\nSetup complete."
Write-Host "To start the full stack, run (from repo root):"
Write-Host "  .\Venus-vault.ps1"
Write-Host "or"
Write-Host "  .\Venus-vault.cmd"

Write-Host "\nIf any npm or pip installs failed, re-run this script after fixing the environment."

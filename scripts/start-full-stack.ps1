<#
Start full VentusVault stack for local Expo testing.

Usage: run this from PowerShell with execution policy allowing scripts:
    powershell -ExecutionPolicy Bypass -File .\scripts\start-full-stack.ps1
#>

# Determine repository root (parent of the scripts folder)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Split-Path -Parent $scriptDir
Set-Location $root

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

Write-Host "[1/5] Installing dependencies (this may take a while)..."
foreach ($s in $services) {
    $path = Join-Path $root $s
    if (-Not (Test-Path $path)) { Write-Host "Skipping missing: $s"; continue }
    Write-Host "--> $s"
    Set-Location $path
    if (Test-Path "package.json") {
        Write-Host "   npm install in $s"
        npm install
    }
    if (Test-Path "requirements.txt") {
        Write-Host "   pip install -r requirements.txt in $s"
        pip install -r requirements.txt
    }
    Set-Location $root
}

Write-Host "[2/5] Ensure .env files exist (copied from .env.example when present)"
Write-Host "Repository root: $root"
Write-Host "Checking service .env examples..."
foreach ($s in $services) {
    $example = Join-Path $root (Join-Path $s ".env.example")
    $dest = Join-Path $root (Join-Path $s ".env")
    if (Test-Path $example) {
        if (-not (Test-Path $dest)) {
            Copy-Item $example $dest
            Write-Host "  Created $s\.env from .env.example"
        }
    }
}

Write-Host "[3/5] Starting Node services in new PowerShell windows"
$nodeServices = @(
    "services\api-gateway",
    "services\auth-service",
    "services\wallet-service",
    "services\transaction-service",
    "services\rate-service",
    "services\notification-service",
    "services\payments-service"
)
foreach ($s in $nodeServices) {
    $path = Join-Path $root $s
    if (-Not (Test-Path $path)) { Write-Host "Skipping missing: $s"; continue }
    Write-Host "Starting $s"
    Start-Process "powershell" -ArgumentList "-NoExit","-Command","Set-Location -Path '$path'; if (Test-Path package.json) { npm run dev } else { Write-Host 'no package.json in $s' }"
}

Write-Host "[4/5] Starting Python AI engine in new terminal (if present)"
$aiPath = Join-Path $root "services\ai-engine"
if (Test-Path $aiPath) {
    Start-Process "powershell" -ArgumentList "-NoExit","-Command","Set-Location -Path '$aiPath'; uvicorn main:app --reload --port 5000"
} else { Write-Host "AI engine not found at services\ai-engine" }

Write-Host "[5/5] Starting Expo frontend in new terminal"
$fePath = Join-Path $root "frontend"
if (Test-Path $fePath) {
    Start-Process "powershell" -ArgumentList "-NoExit","-Command","Set-Location -Path '$fePath'; npx expo start"
} else { Write-Host "frontend folder not found" }

Write-Host "\n✅ All start commands issued. Check each terminal for logs and any errors."
Write-Host "Open Expo Go and scan the QR code to launch the app on a device."

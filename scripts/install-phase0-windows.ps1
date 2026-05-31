# Phase 0 helper - Windows (Jarvis real runtime plan)
# Run from repo root: .\scripts\install-phase0-windows.ps1

$ErrorActionPreference = "Continue"

Write-Host "Jarvis OS - Phase 0 (Hermes + OpenClaw) on Windows" -ForegroundColor Cyan
Write-Host ""

if (Get-Command wsl -ErrorAction SilentlyContinue) {
    wsl --status 2>&1 | ForEach-Object { Write-Host $_ }
    Write-Host ""
    wsl -l -v 2>&1 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "[!] WSL not found. Install with: wsl --install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "1. OpenClaw gateway (WSL2 Ubuntu)" -ForegroundColor Green
Write-Host "   https://docs.openclaw.ai/gateway"
Write-Host "   Default: http://127.0.0.1:18789"
Write-Host ""
Write-Host "2. Nous Hermes Agent (Python 3.11+)" -ForegroundColor Green
Write-Host "   https://github.com/NousResearch/hermes-agent"
Write-Host "   POST {HERMES_ENDPOINT}/v1/jarvis/plan"
Write-Host ""
Write-Host "3. If WSL2 says virtualization disabled:" -ForegroundColor Yellow
Write-Host "   - BIOS: enable Intel VT-x / AMD-V"
Write-Host "   - Admin PowerShell: .\scripts\enable-wsl-virtualization.ps1"
Write-Host ""
Write-Host "4. Health check:" -ForegroundColor Green
Write-Host "   npx tsx scripts/setup-runtime-health.mjs"
Write-Host ""

$repoRoot = Join-Path $PSScriptRoot ".."
$envFile = Join-Path $repoRoot ".env"
if (Test-Path $envFile) {
    Push-Location $repoRoot
    npx tsx scripts/setup-runtime-health.mjs
    Pop-Location
} else {
    Write-Host "[!] No .env in repo root. Copy .env.example to .env first." -ForegroundColor Yellow
}

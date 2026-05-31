# Start Jarvis desktop (embedded API on 8787).
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Starting Jarvis desktop..." -ForegroundColor Cyan
npm run dev --workspace=@jarvis/desktop

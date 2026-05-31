# Enable Windows features required for WSL2.
# Run PowerShell AS ADMINISTRATOR, then reboot.

#Requires -RunAsAdministrator

Write-Host "Enabling Virtual Machine Platform and WSL..." -ForegroundColor Cyan

dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

Write-Host ""
Write-Host "Done. REBOOT the PC." -ForegroundColor Yellow
Write-Host "After reboot:" -ForegroundColor Green
Write-Host "  wsl --install -d Ubuntu"
Write-Host "  wsl --status"

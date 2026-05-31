# Start OpenClaw gateway in WSL (port 18789). Keep this window open.
$token = $env:OPENCLAW_GATEWAY_TOKEN
if (-not $token) {
  $token = "jarvis-dev-gateway-token-change-me"
}

Write-Host "Starting OpenClaw gateway on http://127.0.0.1:18789 (WSL)..." -ForegroundColor Cyan
wsl -d Ubuntu bash -lc "PATH=/home/haseeb_rasheed/.hermes/node/bin:/home/haseeb_rasheed/.local/bin:/usr/bin:/bin; export OPENCLAW_GATEWAY_TOKEN=$token; exec openclaw gateway --port 18789 --allow-unconfigured --verbose"

#!/usr/bin/env bash
# Phase 0 — run INSIDE Ubuntu (WSL): bash scripts/phase0-wsl-setup.sh
set -euo pipefail

echo "=== Jarvis Phase 0 (WSL) ==="

# Node 20+ for OpenClaw
if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 22 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

# Hermes (Nous) — official installer
if ! command -v hermes >/dev/null 2>&1; then
  echo "Installing Nous Hermes Agent..."
  curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
fi
hermes --version 2>/dev/null || echo "hermes CLI installed (run: hermes doctor)"

echo ""
echo "=== OpenClaw (manual) ==="
echo "Follow https://docs.openclaw.ai/gateway then run: openclaw gateway run"
echo "Default port: 18789"
echo ""
echo "=== Jarvis .env (Windows) ==="
echo "HERMES_MODE=official"
echo "HERMES_ENDPOINT=http://127.0.0.1:8080"
echo "OPENCLAW_MODE=official"
echo "OPENCLAW_ENDPOINT=http://127.0.0.1:18789"
echo ""
echo "Health (from Windows): npx tsx scripts/setup-runtime-health.mjs"

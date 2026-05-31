# External runtime setup (Hermes + OpenClaw)

Jarvis integrates **Nous Hermes Agent** (planning) and **OpenClaw gateway** (execution) via adapters only — never from the desktop UI.

## Windows (recommended)

1. Install **WSL2** + Ubuntu.
2. Install **Node.js 20+** in WSL for OpenClaw.
3. Install **Python 3.11+** for Nous Hermes Agent.

### OpenClaw gateway

- Docs: https://docs.openclaw.ai/gateway
- Repo: https://github.com/openclaw/openclaw
- Default loopback port: **18789**
- Set `OPENCLAW_GATEWAY_TOKEN` on the gateway and in Jarvis `.env`.

```bash
# In WSL — follow upstream install, then:
openclaw gateway run
```

Jarvis env:

```env
OPENCLAW_MODE=official
OPENCLAW_ENDPOINT=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your-token
JARVIS_BROWSER_REAL=false
```

### Nous Hermes Agent

- Repo: https://github.com/NousResearch/hermes-agent
- Default planning HTTP surface expected by Jarvis: `POST {HERMES_ENDPOINT}/v1/jarvis/plan`

```env
HERMES_MODE=official
HERMES_ENDPOINT=http://127.0.0.1:8080
```

Install and start the Hermes runtime per upstream README, then expose the plan endpoint (or run Jarvis with `HERMES_MODE=stub` until the sidecar is up).

## Health check

```bash
npx tsx scripts/setup-runtime-health.mjs
```

**Windows (Phase 0 checklist):**

```powershell
cd "d:\Jarvis_Os System"
.\scripts\install-phase0-windows.ps1
```

If `wsl --status` says **virtualization is not enabled**:

1. Reboot after `wsl --install` (required once).
2. Enable **Intel VT-x / AMD-V** in BIOS/UEFI.
3. **Admin** PowerShell: `.\scripts\enable-wsl-virtualization.ps1` then reboot again.
4. `wsl --install -d Ubuntu`

Requires WSL2 for OpenClaw gateway (install OpenClaw inside Ubuntu per upstream docs).

## Jarvis real-mode baseline

Copy `.env.example` to `.env` and set:

- `JARVIS_ALLOW_LLM_STUB_FALLBACK=false`
- `HERMES_MODE=official` (or `stub` for offline dev)
- `OPENCLAW_MODE=official` (or `local` for Playwright-only transition)
- Provider keys: `GROQ_API_KEY`, `SERPER_API_KEY` as needed for voice/search

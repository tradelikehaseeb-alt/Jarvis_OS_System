# Jarvis OS — Resume Point

Use this file after a break or context reset.

**Last completed:** Real Hermes + OpenClaw **integration code** (adapters, orchestrator gates, memory-service default, CI workflow)  
**Checkpoint docs:** `docs/PROJECT_STATUS.md`, `docs/RUNTIME_SETUP.md`, `.cursor/plans/real_hermes_openclaw_392f407d.plan.md`

---

## Where the project stands

- Monorepo + E2E task pipeline: **done** (Phases 0–15)
- Runtime, memory, activity, timeline, workspace: **done** (Phases 45–76)
- Live LLM providers + validation: **done** (Phases 82–88)
- Command Center UI + provider streaming: **done** (Phase 89)
- Voice-native UI + real-time mic/STT/TTS: **done** (Phases 90–91)
- **Official adapters in code:** `HermesAdapterOfficial`, `OpenClawAdapterOfficial`, `shouldUseOrchestratorLlmPlanning`, `JARVIS_MEMORY_BACKEND`

**Blocked on your machine (Phase 0):** WSL2 not installed → OpenClaw gateway install deferred. Nous Hermes HTTP endpoint must be running for `HERMES_MODE=official`.

**Not done:** production transport, auth/tenancy, PostgreSQL task store, full web UI, SaaS billing.

---

## Test baseline (integration branch)

```bash
npm run test --workspace=@jarvis/hermes      # 83
npm run test --workspace=@jarvis/openclaw    # 79
npm run test --workspace=@jarvis/orchestrator # 299
```

---

## Quick start

```bash
npm install
npm run build
cp .env.example .env
```

See [docs/SETUP.md](docs/SETUP.md) and [docs/RUNTIME_SETUP.md](docs/RUNTIME_SETUP.md).

**Runtime health:**

```bash
npx tsx scripts/setup-runtime-health.mjs
```

**Real-mode `.env` (after Phase 0 install):**

```env
HERMES_MODE=official
HERMES_ENDPOINT=http://127.0.0.1:8080
OPENCLAW_MODE=official
OPENCLAW_ENDPOINT=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=<from gateway>
JARVIS_ALLOW_ORCHESTRATOR_LLM_PLANNING=false
JARVIS_MEMORY_BACKEND=memory-service
```

Until gateways are up, use `HERMES_MODE=stub` or `planning`, and `OPENCLAW_MODE=local` (Playwright).

**Dev stack:**

```bash
# Terminal 1
cd services/api-gateway
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
uvicorn app.main:app --reload --port 8787

# Terminal 2
npm run dev --workspace=@jarvis/desktop
```

---

## Architecture (one line)

```
UI → API Gateway → Orchestrator → HermesAgent / OpenClawAgent → Skills
```

Official path: Hermes HTTP plan API + OpenClaw gateway tools (not duplicate orchestrator LLM planning).

---

## Next actions

1. `wsl --install` (Windows) → install OpenClaw gateway per [RUNTIME_SETUP.md](docs/RUNTIME_SETUP.md)
2. Install Nous Hermes Agent → expose `POST /v1/jarvis/plan`
3. Set `OPENCLAW_MODE=official`, run `npx tsx scripts/setup-runtime-health.mjs`
4. Optional live probe: `set HERMES_INTEGRATION_LIVE=true` then `node scripts/phase100c-probe.mjs`

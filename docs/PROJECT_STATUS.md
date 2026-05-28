# Jarvis OS — Project Status

**Checkpoint date:** May 2026  
**Current phase:** **92 complete**  
**Monorepo:** Turborepo, npm workspaces

---

## Executive summary

Jarvis OS is a production-oriented AI operating system with strict layered architecture. The desktop app delivers a **Jarvis Command Center** with voice-native interaction, multi-provider LLM inference (stub fallback), real-time speech adapters, and full task execution through API → Orchestrator → Hermes/OpenClaw → Skills.

Phases **0–92** are implemented in code. Authentication, multi-tenancy, production transport, and full web UI remain planned.

---

## Test coverage (Phase 92 verified)

| Workspace | Tests |
|-----------|-------|
| `@jarvis/desktop` | 180 |
| `@jarvis/speech-service` | 84 |
| `@jarvis/orchestrator` | 243 |

```bash
npm run test --workspace=@jarvis/desktop
npm run test --workspace=@jarvis/speech-service
npm run test --workspace=@jarvis/orchestrator
```

---

## Architecture (enforced)

```
UI (apps) → API Gateway → Orchestrator → Agents → Skills
```

| Rule | Status |
|------|--------|
| User only sees Jarvis UI | Enforced — execution labels hide Hermes/OpenClaw |
| Frontend never calls OpenClaw | Enforced |
| Hermes memory via Memory Service APIs | Contract + local memory runtime |
| Voice → API → Orchestrator for tasks | Enforced |
| No duplicate state systems | Single voice session + conversation hooks |

---

## Desktop (`apps/desktop`) — current

| Feature | State |
|---------|--------|
| Command center layout | Phase 89 — `JarvisCommandCenter`, glassmorphism |
| Voice-native UI | Phase 90 — orb, overlay, interrupt (default on) |
| Real microphone + streaming STT | Phase 91 — `BrowserMicrophoneRuntime` |
| UX polish | Phase 92 — Framer Motion, stabilized partials, progressive streaming |
| Provider settings UI | Phase 83 — API keys, model selection |
| Intent classification | Phase 24 — badge + API `intent.kind` |
| Hermes plan rendering | Phase 23 — goal, steps, collapsible details |
| Runtime health / startup | Phases 73–74 |
| Activity stream + timeline | Phases 71, 75 |
| Conversation workspace | Phase 76 |

See `apps/desktop/README.md`, `docs/VOICE.md`, `docs/screenshots/README.md`.

---

## Services — current

| Service | State |
|---------|--------|
| `api-gateway` | FastAPI — tasks, conversations, orchestrator clients |
| `orchestrator` | Live execution, capability routing, LLM providers, speech bridge, memory |
| `speech-service` | Normalization, voice session, real-time STT/TTS, voice execution |
| `memory-service` | Contracts + stubs |
| `local-memory` | File-backed persistence via orchestrator |

---

## Agents & skills

| Agent | Role | Integration |
|-------|------|-------------|
| Hermes | Planning, reasoning | LLM provider runtime + planning adapter |
| OpenClaw | Browser/desktop execution | Gateway + sandbox boundaries |

| Skill | Bound to |
|-------|----------|
| `search-skill` | Hermes |
| `browser-skill`, `file-skill` | OpenClaw |

---

## Providers

Seven LLM providers + Ollama; four STT and three TTS adapters. Stub fallback when unconfigured.

Full matrix: [PROVIDERS.md](./PROVIDERS.md)

---

## What is NOT implemented yet

- Production orchestrator transport (HTTP/gRPC replacing LocalCli bridge)
- PostgreSQL / Redis backends for tasks and memory
- Authentication / multi-tenancy / SaaS billing
- Full `apps/web` product UI
- Committed UI screenshot assets (paths documented only)
- Official Hermes/OpenClaw vendor SDKs in production deployment

See [NEXT_STEPS.md](./NEXT_STEPS.md).

---

## Verification commands

```bash
npm install
npm run build

npm run test --workspace=@jarvis/desktop
npm run test --workspace=@jarvis/speech-service
npm run test --workspace=@jarvis/orchestrator
```

**API gateway:**

```bash
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=stub
pytest
```

**Desktop dev:**

```bash
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
cd services/api-gateway && uvicorn app.main:app --reload --port 8000
npm run dev --workspace=@jarvis/desktop
```

Setup guide: [SETUP.md](./SETUP.md)

---

## Related documents

| Document | Purpose |
|----------|---------|
| [COMPLETED_PHASES.md](./COMPLETED_PHASES.md) | Phase delivery log |
| [PHASES.md](./PHASES.md) | Official phase table |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer rules |
| [VOICE.md](./VOICE.md) | Voice capabilities |
| [PROVIDERS.md](./PROVIDERS.md) | Provider matrix |
| [../RESUME_POINT.md](../RESUME_POINT.md) | Restart guide |

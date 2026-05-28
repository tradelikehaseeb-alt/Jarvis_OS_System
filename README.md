# Jarvis OS

Production-grade AI Operating System and SaaS platform — planning, execution, voice, memory, and multi-provider inference behind a single **Jarvis** experience.

**Current checkpoint:** Phase **100** — real world Jarvis validation.

## Architecture

```
UI (apps) → API Gateway (services) → Orchestrator → Agents → Skills
```

| Layer | Path | Stack |
|-------|------|-------|
| Web UI | `apps/web` | Next.js, TypeScript |
| Desktop UI | `apps/desktop` | Electron, React, TypeScript |
| API Gateway | `services/api-gateway` | FastAPI (Python) |
| Orchestrator | `services/orchestrator` | TypeScript (`@jarvis/orchestrator`) |
| Speech | `services/speech-service` | TypeScript (`@jarvis/speech-service`) |
| Memory | `services/memory-service`, `services/local-memory` | TypeScript |
| Agents | `agents/` | Hermes (planning), OpenClaw (execution) |
| Skills | `skills/` | search, browser, file |
| Packages | `packages/` | types, logger, config, shared-utils, provider-registry, runtime-manager |
| Docs | `docs/` | Architecture, setup, phases, voice, providers |

## Recent phases (88–93)

| Phase | Scope |
|-------|--------|
| **88** | Real AI response validation — live provider detection, streaming, stub fallback |
| **89** | Jarvis Command Center UI + real provider SSE streaming + user-facing execution labels |
| **90** | Voice-native UI — orb, overlay, wake word, interruption |
| **91** | Real-time voice — browser mic, streaming STT/TTS adapters |
| **92** | Quality pass — Framer Motion, transcript stabilization, progressive streaming |
| **93** | Memory intelligence — adaptive recall, continuity profiles, "Remembered context" UI |
| **94** | Production hardening — recovery, provider health, safe fallbacks |
| **95** | Real browser & desktop execution runtime |
| **96** | Demo & human interaction validation |
| **97** | Personal AI workforce — parallel workers, delegation, live timeline UI |
| **98** | Daily productivity — email/tasks/research/scheduling, dashboard UI, voice intents |
| **99** | Continuous runtime — background workflows, proactive notifications, persistent presence |
| **100** | Real-world validation — provider/voice/browser/daily usage quality gates |

Phase READMEs: `docs/PHASES.md` · Voice: `docs/VOICE.md` · Memory: `docs/MEMORY.md` · Providers: `docs/PROVIDERS.md` · Agents: `docs/AGENTS.md` · Vision: `docs/VISION.md` · Productivity: `docs/PRODUCTIVITY.md` · Continuous: `docs/CONTINUOUS.md` · Real world: `docs/REAL_WORLD_VALIDATION.md`

## Desktop capabilities (today)

- **Command center** — glassmorphism layout, live execution panel, activity stream, minimal sidebar
- **Voice-native mode** — `LiveSpeechOrb`, partial transcript overlay, barge-in interrupt (default on)
- **Real microphone** — `getUserMedia` + streaming STT when `useRealMicrophone: true` (default)
- **LLM providers** — OpenAI, Groq, Gemini, OpenRouter, DeepSeek, Minimax, Ollama (Settings → Providers)
- **Intent routing** — deterministic classifier → `POST /tasks` → Hermes plan + OpenClaw execution
- **Polish (92)** — memoized waveforms, stabilized partials, progressive response rendering
- **Memory intelligence (93)** — adaptive recall, session continuity, subtle context indicators
- **AI workforce (97)** — multi-agent coordination, live workforce timeline, user-facing task labels
- **Productivity automation (98)** — daily assistant, email/task workflows, proactive suggestions
- **Continuous runtime (99)** — background monitoring, smart notifications, persistent Jarvis presence
- **Real-world validation (100)** — provider failover, voice/browser/daily usage quality gates

UI screenshots: `docs/screenshots/README.md`

## Tech stack

- **Turborepo** — monorepo orchestration
- **TypeScript strict** — apps, services, agents, skills
- **Next.js** — web UI
- **Electron + Vite** — desktop shell
- **FastAPI** — API gateway
- **Framer Motion** — desktop transitions (Phase 92)
- **Vitest** — unit and integration tests

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Python ≥ 3.11 (API gateway)
- Docker (optional — `infrastructure/`)
- Ollama (optional — local LLM)
- Microphone (optional — real voice; tests use synthetic capture)

## Quick start

```bash
npm install
npm run build
cp .env.example .env
```

**Desktop + API (dev):**

```bash
# Terminal 1 — API gateway
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge   # Windows
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Desktop
npm run dev --workspace=@jarvis/desktop
```

Full setup: [`docs/SETUP.md`](docs/SETUP.md)

## Tests (last verified — Phase 92)

```bash
npm run test --workspace=@jarvis/orchestrator     # 258+ tests
npm run test --workspace=@jarvis/desktop          # 186+ tests
npm run test --workspace=@jarvis/speech-service   # 85+ tests
npm run test --workspace=@jarvis/hermes           # 75+ tests
npm run test --workspace=@jarvis/openclaw         # see workspace
```

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/README.md`](docs/README.md) | Documentation index |
| [`docs/SETUP.md`](docs/SETUP.md) | Install, env, run desktop/API/voice |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layer rules and module map |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Current implementation snapshot |
| [`docs/PHASES.md`](docs/PHASES.md) | Delivery phase table |
| [`docs/VOICE.md`](docs/VOICE.md) | Voice & speech runtime capabilities |
| [`docs/MEMORY.md`](docs/MEMORY.md) | Memory intelligence & context recall |
| [`docs/PROVIDERS.md`](docs/PROVIDERS.md) | LLM + STT/TTS provider support |
| [`RESUME_POINT.md`](RESUME_POINT.md) | Restart guide after a break |

## Rules

- User only sees **Jarvis** — never Hermes/OpenClaw in the client UI.
- Frontend never calls OpenClaw directly.
- Hermes uses Jarvis Memory Service APIs for persistent memory.
- See [`.cursor/rules/jarvis-os.mdc`](.cursor/rules/jarvis-os.mdc) for full project rules.

## License

Proprietary — Jarvis OS.

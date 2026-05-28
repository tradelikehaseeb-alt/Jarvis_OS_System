# Jarvis OS

Production-grade AI Operating System and SaaS platform — planning, execution, voice, memory, and multi-provider inference behind a single **Jarvis** experience.

**Current checkpoint:** Phase **92** — quality & responsiveness polish (Framer Motion, voice smoothness, streaming UX, performance).

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

## Recent phases (88–92)

| Phase | Scope |
|-------|--------|
| **88** | Real AI response validation — live provider detection, streaming, stub fallback |
| **89** | Jarvis Command Center UI + real provider SSE streaming + user-facing execution labels |
| **90** | Voice-native UI — orb, overlay, wake word, interruption (mock capture path) |
| **91** | Real-time voice — browser mic, streaming STT/TTS adapters, orchestrator speech bridge |
| **92** | Quality pass — Framer Motion, transcript stabilization, throttled waveforms, progressive streaming |

Phase READMEs: `docs/PHASES.md` · Voice: `docs/VOICE.md` · Providers: `docs/PROVIDERS.md`

## Desktop capabilities (today)

- **Command center** — glassmorphism layout, live execution panel, activity stream, minimal sidebar
- **Voice-native mode** — `LiveSpeechOrb`, partial transcript overlay, barge-in interrupt (default on)
- **Real microphone** — `getUserMedia` + streaming STT when `useRealMicrophone: true` (default)
- **LLM providers** — OpenAI, Groq, Gemini, OpenRouter, DeepSeek, Minimax, Ollama (Settings → Providers)
- **Intent routing** — deterministic classifier → `POST /tasks` → Hermes plan + OpenClaw execution
- **Polish (92)** — memoized waveforms, stabilized partials, progressive response rendering

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
npm run test --workspace=@jarvis/desktop          # 180 tests
npm run test --workspace=@jarvis/speech-service   # 84 tests
npm run test --workspace=@jarvis/orchestrator     # 243 tests
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
| [`docs/PROVIDERS.md`](docs/PROVIDERS.md) | LLM + STT/TTS provider support |
| [`RESUME_POINT.md`](RESUME_POINT.md) | Restart guide after a break |

## Rules

- User only sees **Jarvis** — never Hermes/OpenClaw in the client UI.
- Frontend never calls OpenClaw directly.
- Hermes uses Jarvis Memory Service APIs for persistent memory.
- See [`.cursor/rules/jarvis-os.mdc`](.cursor/rules/jarvis-os.mdc) for full project rules.

## License

Proprietary — Jarvis OS.

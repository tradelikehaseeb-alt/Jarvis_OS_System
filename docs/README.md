# Jarvis OS Documentation

**Start here after a break:** [`../RESUME_POINT.md`](../RESUME_POINT.md)

## Setup & operations

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Install, environment, run desktop/API, voice toggles |
| [../README.md](../README.md) | Project overview and quick start |
| [../.env.example](../.env.example) | Environment variable template |

## Architecture

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer model and non-negotiable rules |
| [ARCHITECTURE_SNAPSHOT.md](./ARCHITECTURE_SNAPSHOT.md) | Historical diagrams (Phase 15 baseline) |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | **Current** implementation snapshot (Phase 92) |

## Product capabilities

| Document | Description |
|----------|-------------|
| [VOICE.md](./VOICE.md) | Voice-native UI, STT/TTS, speech-service runtime |
| [PROVIDERS.md](./PROVIDERS.md) | LLM, STT, and TTS provider matrix |
| [screenshots/README.md](./screenshots/README.md) | UI screenshot & GIF reference paths |

## Delivery history

| Document | Description |
|----------|-------------|
| [PHASES.md](./PHASES.md) | Official phase table (0–92) |
| [COMPLETED_PHASES.md](./COMPLETED_PHASES.md) | Detailed log (0–15) + summary (16–92) |
| [NEXT_STEPS.md](./NEXT_STEPS.md) | Backlog and deferred work |

## Phase READMEs (88–92)

| Phase | Location |
|-------|----------|
| 89 Command Center + provider streaming | `apps/desktop/src/renderer/command-center/PHASE-89-README.md`, `services/orchestrator/src/llm-provider/PHASE-89-README.md` |
| 90 Voice-native UI | `apps/desktop/src/renderer/voice-native/PHASE-90-README.md`, `services/speech-service/src/voice-session/PHASE-90-README.md` |
| 91 Real-time voice | `apps/desktop/src/renderer/voice-native/PHASE-91-README.md`, `services/speech-service/src/real-time/PHASE-91-README.md` |
| 92 Quality & responsiveness | `apps/desktop/src/renderer/polish/PHASE-92-README.md` |

## Module READMEs

| Area | Path |
|------|------|
| Desktop app | `apps/desktop/README.md` |
| Speech service | `services/speech-service/README.md` |
| Orchestrator | `services/orchestrator/README.md` |
| LLM connectors | `services/orchestrator/src/llm-provider/connectors/README.md` |
| Provider settings UI | `apps/desktop/src/renderer/providers/README.md` |
| Legacy voice shell | `apps/desktop/src/renderer/voice/README.md` |

## Integration plans (Phase 19)

| Document | Description |
|----------|-------------|
| [HERMES_INTEGRATION_PLAN.md](./HERMES_INTEGRATION_PLAN.md) | Hermes runtime research + adapter mapping |
| [OPENCLAW_INTEGRATION_PLAN.md](./OPENCLAW_INTEGRATION_PLAN.md) | OpenClaw gateway research + sandbox |

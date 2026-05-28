# Jarvis OS — Resume Point

Use this file after a break or context reset.

**Last completed phase:** **93** (memory & context intelligence)  
**Checkpoint docs:** `docs/PROJECT_STATUS.md`, `docs/PHASES.md`, `docs/SETUP.md`, `docs/VOICE.md`

---

## Where the project stands

- Monorepo + E2E task pipeline: **done** (Phases 0–15)
- Runtime, memory, activity, timeline, workspace: **done** (Phases 45–76)
- Live LLM providers + validation: **done** (Phases 82–88)
- Command Center UI + provider streaming: **done** (Phase 89)
- Voice-native UI + real-time mic/STT/TTS: **done** (Phases 90–91)
- UX polish (motion, latency, performance): **done** (Phase 92)

**Not done:** production transport, auth/tenancy, PostgreSQL task store, full web UI, SaaS billing, committed screenshot assets.

---

## Test baseline (Phase 92)

```bash
npm run test --workspace=@jarvis/desktop          # 182
npm run test --workspace=@jarvis/speech-service   # 84
npm run test --workspace=@jarvis/orchestrator     # 252
npm run test --workspace=@jarvis/hermes           # 74
```

---

## Quick start

```bash
npm install
npm run build
cp .env.example .env
```

See [docs/SETUP.md](docs/SETUP.md) for API gateway + desktop + voice toggles.

**Dev stack:**

```bash
# Terminal 1
cd services/api-gateway
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
uvicorn app.main:app --reload --port 8000

# Terminal 2
npm run dev --workspace=@jarvis/desktop
```

---

## Architecture (one line)

```
UI → API Gateway → Orchestrator → CapabilityRouter → Agent → SkillExecutor → Skill → TaskStore → Response
```

Voice tasks use the same API path after `@jarvis/speech-service` normalization and intent classification.

---

## Key areas (Phase 92)

| Area | Path |
|------|------|
| Command center | `apps/desktop/src/renderer/command-center/` |
| Voice-native | `apps/desktop/src/renderer/voice-native/` |
| Polish (92) | `apps/desktop/src/renderer/polish/` |
| Speech real-time | `services/speech-service/src/real-time/` |
| LLM providers | `services/orchestrator/src/llm-provider/` |
| Voice settings | `apps/desktop/src/renderer/voice/voice-settings.ts` |

---

## Next recommended work (Phase 93+)

1. **Production transport** — HTTP/gRPC orchestrator client replacing LocalCli bridge
2. **Web UI parity** — task/voice surfaces in `apps/web`
3. **Auth + tenancy** — API gateway middleware, user scoping
4. **Database TaskStore** — PostgreSQL behind existing `TaskStore` interface
5. **UI assets** — capture screenshots per `docs/screenshots/README.md`

See [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).

---

## Rules (do not violate)

1. Frontend never controls OpenClaw directly.
2. Hermes uses Memory Service APIs for persistent memory.
3. User only sees Jarvis UI.
4. No duplicate state systems or runtime layers.
5. TypeScript strict; tests per module.
6. Scan repo before creating files — reuse existing modules.

---

## Documentation index

| File | Purpose |
|------|---------|
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Current state |
| [docs/SETUP.md](docs/SETUP.md) | Install & run |
| [docs/VOICE.md](docs/VOICE.md) | Voice capabilities |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Provider matrix |
| [docs/PHASES.md](docs/PHASES.md) | Phase table |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layer rules |

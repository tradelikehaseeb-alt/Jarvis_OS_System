# Jarvis OS — Resume Point

Use this file after a break or context reset to continue development without re-discovering the repo.

**Last completed phase:** 15  
**Checkpoint docs:** `docs/PROJECT_STATUS.md`, `docs/COMPLETED_PHASES.md`, `docs/ARCHITECTURE_SNAPSHOT.md`, `docs/NEXT_STEPS.md`

---

## Where the project stands

- Monorepo scaffold and contracts: **done** (Phases 0–2)
- API gateway + orchestrator + memory skeletons: **done** (Phases 3–7)
- Agent and skill frameworks: **done** (Phases 8–9)
- Hermes/OpenClaw **stubs** + concrete **mock** skills: **done** (Phases 10–13)
- End-to-end `POST /tasks` → agent → skill: **done** (Phase 14)
- `TaskStore` abstraction (memory + file): **done** (Phase 15)

**Not done:** real LLM, real OpenClaw automation, memory HTTP, database, auth, production transport, voice, plugins, SaaS.

---

## Next recommended phase after restart

### Phase 16: Real Hermes / OpenClaw adapters

**Official integrations only — do not copy external code into the monorepo.**

| Workstream | Goal |
|------------|------|
| **Hermes adapter** | Replace stub planning/reasoning with official Hermes (or approved) API integration behind existing `HermesAgent` + `SkillExecutor` |
| **OpenClaw adapter** | Replace stub execution with official OpenClaw gateway integration behind `OpenClawAgent` |
| **Compatibility** | Keep `CapabilityRouter`, bindings, and skill ids stable; swap adapter internals |
| **CI** | Retain stub mode via env flag for tests without external services |

**Suggested first tasks:**

1. Read `agents/hermes/src/hermes-agent.ts` and `agents/openclaw/src/openclaw-agent.ts` — extension points for adapters.
2. Define adapter interfaces in `agents/shared` (or thin `agents/hermes-adapter`, `agents/openclaw-adapter` packages).
3. Wire adapters in `@jarvis/agents-bootstrap` with stub fallback.
4. Add integration tests behind feature flags; do not break Phase 14 API E2E stub client tests.

**Out of scope for Phase 16 (defer):**

- PostgreSQL / Redis `TaskStore`
- Memory Service HTTP persistence
- Authentication
- Electron/STT/TTS/voice

---

## Quick orientation commands

```bash
# Install
npm install

# Orchestrator + agents + skills tests
npm run test --workspace=@jarvis/orchestrator
npm run test --workspace=@jarvis/agents-shared
npm run test --workspace=@jarvis/agents-bootstrap

# API gateway (no Node required)
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=stub
pytest
```

**Dev API with live orchestrator bridge:**

```bash
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
cd services/api-gateway
uvicorn app.main:app --reload --port 8000
```

---

## Architecture reminder (one line)

```
UI → API Gateway → Orchestrator → CapabilityRouter → Agent → SkillExecutor → Skill → TaskStore → Response
```

---

## Key files to open first in Phase 16

| Area | Path |
|------|------|
| Hermes agent | `agents/hermes/src/hermes-agent.ts` |
| OpenClaw agent | `agents/openclaw/src/openclaw-agent.ts` |
| Bootstrap wiring | `agents/bootstrap/src/index.ts` |
| Skill pipeline | `agents/shared/src/create-skill-pipeline.ts` |
| Task execution | `services/orchestrator/src/task-execution/create-task-executor.ts` |
| Capability routing | `services/orchestrator/src/capability-routing/capability-router.ts` |
| API entry | `services/api-gateway/app/controllers/tasks.py` |

---

## Rules (do not violate)

1. Frontend never controls OpenClaw directly.
2. Hermes uses Memory Service APIs for persistent memory (when implemented).
3. User only sees Jarvis UI.
4. Use `@jarvis/types` contracts; no duplicate frameworks.
5. TypeScript strict; tests per module.
6. Official adapter integrations only in Phase 16 — no copied vendor code.

---

## Documentation index

| File | Purpose |
|------|---------|
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Current state snapshot |
| [docs/COMPLETED_PHASES.md](docs/COMPLETED_PHASES.md) | Phases 0–15 log |
| [docs/ARCHITECTURE_SNAPSHOT.md](docs/ARCHITECTURE_SNAPSHOT.md) | Diagrams and flows |
| [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) | Full backlog |
| [docs/PHASES.md](docs/PHASES.md) | Official phase table |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layer rules |

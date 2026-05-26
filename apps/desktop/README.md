# @jarvis/desktop

Jarvis OS **Electron desktop shell** (Phase 18–23).

## Architecture

```
Renderer (React) → preload IPC → main process → api-gateway (POST /tasks)
```

The UI never calls OpenClaw or agents directly.

## Pages

| Page | Data |
|------|------|
| **Chat** | Live `POST /tasks` + `GET /tasks/{id}` — renders Hermes structured plan (Phase 23) |
| Tasks | Mock list |
| Memory | Mock entries |
| Settings | API URL from main process |
| Voice | Mock voice shell (no STT/TTS/device) |
| Plugins | Mock registry |

## Components

`Sidebar`, `Header`, `ChatInput`, `ChatMessages`, `HermesPlanMessage`, `TaskPanel`, `VoiceShell`, `VoiceButton`, `VoiceTranscriptPanel`

## Voice shell (Phase 25–27)

Mock capture only — prepares UI for future STT/TTS.
Phase 27 adds `SpeechNormalizer` in the voice pipeline before intent classification, with original vs normalized transcript display and corrections list.
See `src/renderer/voice/README.md`.

## Chat flow (Phase 23–24)

```
User message → IntentClassifier → POST /tasks → GET /tasks/{id}
  → Hermes structured plan (when routed to Hermes + plan output)
```

### Intent classification (Phase 24)

| Chat intent | Shown as badge | Sent as API `kind` |
|-------------|----------------|---------------------|
| plan | Plan | `plan` |
| research | Research | `research` |
| search | Search | `research` |
| automate | Automate | `automate` |
| conversation | Conversation | `default` |

See `src/renderer/intent/README.md`.

### Hermes plan UI (Phase 23)

| UI element | Source |
|------------|--------|
| **Goal** | `structuredPlan.goal` |
| **Steps** | `structuredPlan.steps` (ordered list) |
| **Hermes badge** | Routing `selectedAgentId: hermes` |
| **Planning Details** | Collapsible adapter/reasoning metadata |

Enable structured planning on the orchestrator: `HERMES_PLANNING_ADAPTER=planning` (see `@jarvis/hermes`).

## Run

**Terminal 1 — API gateway (stub or bridge):**

```bash
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=stub
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Desktop:**

```bash
npm install
npm run dev --workspace=@jarvis/desktop
```

Optional: `set JARVIS_API_URL=http://127.0.0.1:8000`

## Scripts

| Script | Description |
|--------|-------------|
| `build:renderer` | Vite → `dist/renderer/` |
| `build:main` | TypeScript main + preload → `dist/` |
| `build` | Both |
| `dev` | Build and launch Electron |
| `test` | Vitest (renderer components + API client) |

## Tests

```bash
npm run test --workspace=@jarvis/desktop
```

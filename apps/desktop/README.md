# @jarvis/desktop

Jarvis OS **Electron desktop shell** — command center, voice-native UI, provider settings, runtime dashboards.

**Current:** Phase **92** — see [`../../docs/PROJECT_STATUS.md`](../../docs/PROJECT_STATUS.md).

## Architecture

```
Renderer (React) → preload IPC → main process → API gateway (POST /tasks)
```

The UI never calls OpenClaw or agents directly. Voice execution flows through `@jarvis/speech-service` then the same API task path.

## Primary surfaces

| Surface | Module | Notes |
|---------|--------|-------|
| **Command center** | `command-center/` | Default chat layout (Phase 89) |
| **Voice-native** | `voice-native/` | Orb, overlay, interrupt (Phase 90–91) |
| **Polish** | `polish/` | Motion, waveforms, progressive text (Phase 92) |
| **Providers** | `providers/` | LLM keys and model selection |
| **Runtime** | `runtime/` | Health + startup panels |
| **Workspace** | `workspace/` | Conversation workspace (Phase 76) |
| **Legacy voice** | `voice/` | Mock shell when `voiceNativeUi: false` |

## Voice settings (`localStorage`: `jarvis.desktop.voiceSettings`)

| Key | Default | Purpose |
|-----|---------|---------|
| `voiceNativeUi` | `true` | Command center voice layout |
| `useRealMicrophone` | `true` | Browser mic + streaming STT |
| `wakeWordEnabled` | `true` | Wake phrase gating |
| `wakePhrase` | `jarvis` | Wake word |
| `listeningMode` | `push-to-talk` | Interaction mode |
| `autoExecuteVoicePipeline` | `true` | Auto-submit after voice capture |

Full reference: [`../../docs/VOICE.md`](../../docs/VOICE.md)

## Chat flow

```
User message (text or voice)
  → IntentClassifier
  → POST /tasks → GET /tasks/{id}
  → Hermes plan + execution lifecycle + activity stream
```

User-facing labels hide internal agent names (`execution-display-labels.ts`).

## Run

**Terminal 1 — API gateway:**

```bash
cd services/api-gateway
pip install -r requirements.txt
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Desktop:**

```bash
npm run dev --workspace=@jarvis/desktop
```

Setup: [`../../docs/SETUP.md`](../../docs/SETUP.md)

## Scripts

| Script | Description |
|--------|-------------|
| `build:renderer` | Vite → `dist/renderer/` |
| `build:main` | TypeScript main + preload → `dist/` |
| `build` | Both |
| `dev` | Build and launch Electron |
| `test` | Vitest (180 tests, Phase 92) |

## Tests

```bash
npm run test --workspace=@jarvis/desktop
```

## Phase READMEs

| Phase | File |
|-------|------|
| 89 | `src/renderer/command-center/PHASE-89-README.md` |
| 90 | `src/renderer/voice-native/PHASE-90-README.md` |
| 91 | `src/renderer/voice-native/PHASE-91-README.md` |
| 92 | `src/renderer/polish/PHASE-92-README.md` |

## UI screenshots

Capture guide: [`../../docs/screenshots/README.md`](../../docs/screenshots/README.md)

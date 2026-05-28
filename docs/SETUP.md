# Jarvis OS — Setup

Install and run the desktop app, API gateway, and optional live providers.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 20 | All TypeScript workspaces |
| npm | ≥ 10 | Workspaces via root `package.json` |
| Python | ≥ 3.11 | `services/api-gateway` only |
| Ollama | optional | Local LLM — `ollama pull llama3.2` |
| Microphone | optional | Real voice; tests use synthetic capture |

## 1. Clone and install

```bash
git clone <repo-url> jarvis-os
cd jarvis-os
npm install
npm run build
cp .env.example .env
```

Edit `.env` for provider API keys (see [PROVIDERS.md](./PROVIDERS.md)).

## 2. API gateway

```bash
cd services/api-gateway
pip install -r requirements.txt
```

**Stub orchestrator (pytest / no Node):**

```bash
set JARVIS_ORCHESTRATOR_CLIENT=stub          # Windows
export JARVIS_ORCHESTRATOR_CLIENT=stub       # macOS/Linux
uvicorn app.main:app --reload --port 8000
```

**Live orchestrator bridge (desktop dev):**

```bash
set JARVIS_ORCHESTRATOR_CLIENT=local_bridge
uvicorn app.main:app --reload --port 8000
```

Verify: `GET http://127.0.0.1:8000/health` (or project health route).

## 3. Desktop app

From repo root:

```bash
npm run dev --workspace=@jarvis/desktop
```

Optional env:

```bash
set JARVIS_API_URL=http://127.0.0.1:8000
```

Build only:

```bash
npm run build --workspace=@jarvis/desktop
```

## 4. Voice settings (desktop)

Stored in `localStorage` key `jarvis.desktop.voiceSettings`. Defaults in `apps/desktop/src/renderer/voice/voice-settings.ts`:

| Setting | Default | Purpose |
|---------|---------|---------|
| `voiceNativeUi` | `true` | Command center voice-native layout |
| `useRealMicrophone` | `true` | Browser mic + streaming STT (Phase 91) |
| `wakeWordEnabled` | `true` | Wake phrase gating |
| `wakePhrase` | `jarvis` | Wake word |
| `listeningMode` | `push-to-talk` | `push-to-talk` \| `continuous` \| `wake-word` |
| `autoExecuteVoicePipeline` | `true` | Voice → intent → task execution |
| `enableNormalization` | `true` | Roman Urdu + English normalization |

**Tests / CI:** set `useRealMicrophone: false` and `voiceNativeUi: false` in saved settings or test harness.

See [VOICE.md](./VOICE.md) for STT/TTS env keys.

## 5. LLM providers

Configure in **Settings → Providers** (desktop) or via env vars:

- `OPENAI_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `MINIMAX_API_KEY`
- Ollama: run locally at `http://localhost:11434` (no key)

Without keys, orchestrator uses deterministic stub responses — safe for CI.

See [PROVIDERS.md](./PROVIDERS.md).

## 6. Run tests

```bash
npm run test --workspace=@jarvis/desktop
npm run test --workspace=@jarvis/speech-service
npm run test --workspace=@jarvis/orchestrator
```

API gateway (Python):

```bash
cd services/api-gateway
set JARVIS_ORCHESTRATOR_CLIENT=stub
pytest
```

## 7. Docker (optional)

```bash
cd infrastructure/docker
docker compose up
```

See `infrastructure/README.md`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Desktop cannot reach API | Confirm gateway on `:8000`, check `JARVIS_API_URL` |
| No live LLM responses | Add a provider key or start Ollama with a model |
| Mic permission denied | Browser/Electron mic permission; or set `useRealMicrophone: false` |
| STT stub only | Set `DEEPGRAM_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY` |
| Tests fail on voice | Tests disable real mic by default — check voice settings in test setup |

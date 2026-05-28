# Provider Support

Jarvis supports multiple LLM, STT, and TTS providers with **stub fallback** when keys or local runtimes are unavailable.

## LLM providers (Hermes planning)

Configured via desktop **Settings → Providers** or environment variables. Orchestrator module: `services/orchestrator/src/llm-provider/`.

| Provider | ID | API key env | Local? |
|----------|-----|-------------|--------|
| OpenAI | `openai` | `OPENAI_API_KEY` | No |
| Groq | `groq` | `GROQ_API_KEY` | No |
| Google Gemini | `gemini` | `GEMINI_API_KEY` or `GOOGLE_API_KEY` | No |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | No |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` | No |
| Minimax | `minimax` | `MINIMAX_API_KEY` | No |
| Ollama | `ollama` | _(none)_ | Yes — `http://localhost:11434` |

### Behavior

- **Auto-detection:** `resolveFirstConfiguredProviderId()` walks priority order when none selected.
- **Streaming:** SSE for OpenAI-compatible APIs; native streaming for Ollama (Phase 89).
- **Stub fallback:** Missing keys or HTTP errors → deterministic stub plan/response (CI-safe).
- **Latency:** Optional `latencyMs` on provider responses.

### Desktop UI

- `ProviderSettingsPage`, `ProviderCard`, `ApiKeyManager`
- Keys saved via IPC — never displayed after save
- See `apps/desktop/src/renderer/providers/README.md`

## STT providers (speech input)

Module: `services/speech-service/src/real-time/`

| Provider | ID | API key env |
|----------|-----|-------------|
| OpenAI Whisper | `whisper` | `OPENAI_API_KEY` |
| Deepgram | `deepgram` | `DEEPGRAM_API_KEY` |
| Groq Whisper | `groq-whisper` | `GROQ_API_KEY` |
| OpenAI Realtime | `openai-realtime` | `OPENAI_API_KEY` |

Desktop preference: `voiceSettings.sttProviderId` (auto when empty).

## TTS providers (speech output)

| Provider | ID | API key env |
|----------|-----|-------------|
| ElevenLabs | `elevenlabs` | `ELEVENLABS_API_KEY` |
| OpenAI TTS | `openai-tts` | `OPENAI_API_KEY` |
| Edge TTS | `edge-tts` | _(none)_ |

Desktop preference: `voiceSettings.ttsProviderId` (auto when empty).

## Environment template

Copy `.env.example` → `.env`. Minimum for live LLM:

```bash
# Pick one or more:
OPENAI_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=

# Optional speech:
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
```

`JARVIS_*` prefixed variants are also supported where implemented.

## Health & validation

- Orchestrator: `ProviderValidationRuntime`, `ProviderHealthRuntime`
- Desktop: provider cards show configured / valid / stub status
- Integration tests run without keys (stub mode)

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/llm-provider
npm run test --workspace=@jarvis/desktop -- --run src/renderer/providers
npm run test --workspace=@jarvis/speech-service -- --run src/real-time
```

## Rules

- Frontend selects providers through Settings — **never** embeds keys in renderer bundle.
- OpenClaw execution stays behind orchestrator; UI does not call OpenClaw APIs directly.
- User-facing labels say **Jarvis** — not Hermes/OpenClaw.

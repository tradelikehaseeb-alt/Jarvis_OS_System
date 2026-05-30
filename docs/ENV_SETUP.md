# Jarvis OS — Environment Setup (Phase 100A)

Copy the template and add at least one live LLM key:

```bash
cp .env.example .env
```

## Minimum for real LLM (pick one)

```bash
GROQ_API_KEY=gsk_...
# or
OPENROUTER_API_KEY=sk-or-...
```

Optional — prefer Groq when both are set:

```bash
JARVIS_LLM_PROVIDER=groq
```

## Real browser execution (Playwright)

```bash
JARVIS_BROWSER_REAL=true
OPENCLAW_MODE=local
```

Install browsers once:

```bash
npm install --workspace=@jarvis/openclaw
npx playwright install chromium --workspace=@jarvis/openclaw
```

## Real voice (STT / TTS)

```bash
GROQ_API_KEY=gsk_...          # Groq Whisper STT
OPENAI_API_KEY=sk-...          # Whisper / OpenAI TTS
DEEPGRAM_API_KEY=...           # Deepgram STT
ELEVENLABS_API_KEY=...         # ElevenLabs TTS
```

## Desktop launch

From repo root:

```bash
npm run build --workspace=@jarvis/desktop
npm run dev --workspace=@jarvis/desktop
```

Electron main loads `.env` from the monorepo root automatically.

## Verify real provider

After sending a task, inspect task output:

```json
"llmProvider": {
  "stub": false,
  "providerId": "groq",
  "latencyMs": 420
}
```

If `stub: true`, the UI shows **STUB MODE** — no silent fallback.

## Safety toggles

| Variable | Default | Purpose |
|----------|---------|---------|
| `JARVIS_ALLOW_LLM_STUB_FALLBACK` | `true` | Set `false` to disable auto-fallback to llm-stub |
| `JARVIS_BROWSER_REAL` | `false` | Set `true` for Playwright browser execution |
| `OPENCLAW_MODE` | `stub` | Set `local` when using real browser path |

See also: [PROVIDERS.md](./PROVIDERS.md), [REAL_WORLD_USAGE.md](./REAL_WORLD_USAGE.md).

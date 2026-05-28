# Phase 89 — Real Provider Integration

## Changes

- **True SSE streaming** for OpenAI-compatible providers (`stream: true` + incremental chunk parsing).
- **Native Ollama streaming** via `/api/chat` with `stream: true`.
- **Latency tracking** — optional `latencyMs` on `LlmProviderResponse`.
- **Provider auto-detection** — `resolveFirstConfiguredProviderId()` walks OpenRouter → Groq → Gemini → OpenAI → DeepSeek → Minimax.
- **Stub fallback preserved** when keys are missing or HTTP/network errors occur.
- **Phase 88 validation** extended to DeepSeek and Minimax priority.

## Supported providers

OpenRouter, Groq, Gemini, OpenAI, DeepSeek, Minimax, Ollama (local).

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/llm-provider/__tests__/phase-89-provider-streaming.integration.test.ts
npm run test --workspace=@jarvis/orchestrator -- --run src/llm-provider/connectors/__tests__/parse-openai-sse-chunks.test.ts
```

## Docs

- [`../../../../docs/PROVIDERS.md`](../../../../docs/PROVIDERS.md)
- [`connectors/README.md`](connectors/README.md)

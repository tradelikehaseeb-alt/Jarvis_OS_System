# LLM Provider Runtime (Phase 81)

Connects the orchestrator to real LLM providers for Hermes planning context, with deterministic stub fallback.

## Flow

```
Orchestrator → LlmProviderRuntime → Hermes planning → OpenClaw execution → workspace/timeline
```

## Providers

| ID | Kind | Notes |
|----|------|-------|
| `llm-stub` | stub | Default deterministic fallback |
| `openai` | openai | Uses `OPENAI_API_KEY` / `JARVIS_OPENAI_API_KEY` |
| `ollama` | ollama | Local `OLLAMA_BASE_URL` (default `http://localhost:11434`) |

## API

| Symbol | Role |
|--------|------|
| `LlmProvider` | Provider contract |
| `LlmProviderRequest` / `LlmProviderResponse` | Prompt I/O |
| `LlmProviderRuntime` | `executePrompt()`, `validateProvider()`, `streamResponse()` |
| `createDefaultLlmProviderRuntime()` | Factory with OpenAI, Ollama, and stub providers |

## Configuration

- `JARVIS_LLM_PROVIDER` or `metadata.llmProviderId` selects provider
- Unconfigured OpenAI/Ollama automatically fall back to stub responses
- Reuses `@jarvis/provider-runtime` for optional Hermes connection validation

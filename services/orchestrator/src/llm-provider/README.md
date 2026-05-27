# LLM Provider Runtime (Phase 81, 82)

Connects the orchestrator to real LLM providers for Hermes planning context, with deterministic stub fallback.

## Flow

```
Desktop Settings → Provider Runtime → Selected Provider → Hermes planning → OpenClaw execution
```

## Providers

| ID | Kind | Notes |
|----|------|-------|
| `llm-stub` | stub | Default deterministic fallback |
| `openai` | openai | Uses `OPENAI_API_KEY` / `JARVIS_OPENAI_API_KEY` |
| `gemini` | gemini | Uses `GEMINI_API_KEY` / `GOOGLE_API_KEY` |
| `groq` | groq | Uses `GROQ_API_KEY` |
| `openrouter` | openrouter | Uses `OPENROUTER_API_KEY` |
| `ollama` | ollama | Local `OLLAMA_BASE_URL` (default `http://localhost:11434`) |
| `deepseek` | deepseek | Uses `DEEPSEEK_API_KEY` |
| `minimax` | minimax | Uses `MINIMAX_API_KEY` |

See [connectors/README.md](./connectors/README.md) for multi-provider connector details.

## API

| Symbol | Role |
|--------|------|
| `LlmProvider` | Provider contract |
| `LlmProviderRequest` / `LlmProviderResponse` | Prompt I/O |
| `LlmProviderRuntime` | `executePrompt()`, `validateProvider()`, `streamResponse()` |
| `createDefaultLlmProviderRuntime()` | Factory with all default providers |
| `ProviderRegistry` | `registerProvider()` + configuration lookup (Phase 82) |
| `ProviderValidationRuntime` | `validateApiKey()`, `getAvailableModels()` (Phase 82) |

## Configuration

- `JARVIS_LLM_PROVIDER` or `metadata.llmProviderId` selects provider
- Unconfigured providers automatically fall back to stub responses
- Reuses `@jarvis/provider-runtime` for optional Hermes connection validation

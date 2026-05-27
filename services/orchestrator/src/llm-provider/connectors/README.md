# Multi-Provider LLM Connectors (Phase 82)

User-selectable real AI providers for Hermes planning, built on {@link LlmProviderRuntime}.

## Providers

| Class | ID | API key env |
|-------|-----|-------------|
| `OpenAIProvider` | `openai` | `OPENAI_API_KEY` |
| `GeminiProvider` | `gemini` | `GEMINI_API_KEY` / `GOOGLE_API_KEY` |
| `GroqProvider` | `groq` | `GROQ_API_KEY` |
| `OpenRouterProvider` | `openrouter` | `OPENROUTER_API_KEY` |
| `OllamaProvider` | `ollama` | _(local, no key)_ |
| `DeepSeekProvider` | `deepseek` | `DEEPSEEK_API_KEY` |
| `MinimaxProvider` | `minimax` | `MINIMAX_API_KEY` |

## API

| Symbol | Role |
|--------|------|
| `ProviderRegistry` | `registerProvider()` + configuration lookup |
| `ProviderConfiguration` | Models, env vars, base URL |
| `ProviderValidationRuntime` | `validateApiKey()`, `getAvailableModels()`, `executePrompt()`, `streamResponse()` |
| `createDefaultProviderValidationRuntime()` | Factory wiring all default connectors |

## Behavior

- Reuses shared OpenAI-compatible executor — no duplicate HTTP logic per provider.
- Delegates execution to `LlmProviderRuntime` with stub fallback.
- Unconfigured providers return deterministic stub responses in tests and local dev.

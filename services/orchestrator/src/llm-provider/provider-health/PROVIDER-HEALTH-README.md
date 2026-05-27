# Provider Health Validation (Phase 85)

Health probes and real provider validation for Jarvis multi-provider LLM runtime.

## Providers

All seven connectors are registered and probed:

| Provider | ID | Health probe |
|----------|-----|--------------|
| Ollama | `ollama` | `GET /api/tags` (local) |
| OpenAI | `openai` | `GET /models` when API key present |
| Gemini | `gemini` | `GET /models` when API key present |
| OpenRouter | `openrouter` | `GET /models` when API key present |
| Groq | `groq` | `GET /models` when API key present |
| DeepSeek | `deepseek` | `GET /models` when API key present |
| Minimax | `minimax` | `GET /models` when API key present |

## Health report fields

- **connectionStatus** — `connected`, `stub`, `unreachable`, or `misconfigured`
- **availableModels** — discovered models or configured fallback list
- **latencyMs** — probe round-trip time
- **failureHandled** — probe errors degrade to stub without throwing

## Real validation commands

Phase 85 commands (force `automate` intent via live execution):

1. `What is the gold price today?`
2. `Summarize latest AI news`
3. `Explain current Bitcoin trend`

Each command validates:

- Provider response received
- Hermes plan created
- OpenClaw execution triggered
- Timeline updated
- Workspace updated
- Telemetry captured

## Usage

```typescript
import {
  createTestRealProviderValidationRuntime,
  createDefaultProviderHealthValidationRuntime,
} from "@jarvis/orchestrator";

const health = createDefaultProviderHealthValidationRuntime();
const all = await health.validateAllProviders();

const validation = await createTestRealProviderValidationRuntime();
const report = await validation.executeRealProviderValidation();
```

Tests run in stub mode when API keys are absent — no external network required for CI.

## Environment

Configure keys via Desktop Settings or env vars (`OPENAI_API_KEY`, `GROQ_API_KEY`, etc.). Ollama uses `OLLAMA_HOST` / default `http://127.0.0.1:11434`.

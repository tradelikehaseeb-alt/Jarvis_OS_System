# Jarvis User Session (Phase 86)

First real user session flow:

```
Desktop Chat/Voice → Provider Settings → Live Provider → Hermes → OpenClaw
  → Activity → Timeline → Workspace → Memory → Telemetry
```

## API

| Export | Role |
|--------|------|
| `JarvisUserSessionRuntime` | Session lifecycle + prompt execution |
| `createDefaultJarvisUserSessionRuntime()` | Production factory |
| `createTestJarvisUserSessionRuntime()` | Stub-safe test factory |

## Methods

- `startUserSession()` — configure all seven providers and open session
- `configureProviders()` — health snapshots for OpenAI, Gemini, Groq, OpenRouter, Ollama, DeepSeek, Minimax
- `executeUserPrompt({ prompt })` — full execution with validation checklist
- `captureSessionTelemetry()` — accumulated provider telemetry
- `runUserSession()` — four canonical user prompts end-to-end

## User prompts

1. What is the gold price today?
2. Summarize latest AI news
3. Plan a Dubai travel itinerary
4. Explain Bitcoin market trend

Stub fallback remains when API keys are absent.

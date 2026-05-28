# Real World Usage Workflows

Daily-usable Jarvis workflows validated in Phase 100.

## Voice workflows

| Command | Expected behavior |
|---------|-------------------|
| "Jarvis, open YouTube and search AI news" | Browser workflow, live progress, completion summary |
| "Jarvis, summarize latest gold market updates" | Research path, provider response, readable result |
| "Jarvis, open Gmail" | Browser automation with permission handling |
| "Jarvis, prepare trading research workspace" | Workspace preparation, background-capable |

## Provider setup

1. Open Settings → Providers
2. Configure at least one of: OpenRouter, Groq, Gemini, OpenAI, DeepSeek
3. Real inference activates when provider health is `connected`
4. Stub fallback only when no live provider is available

## Long-running sessions

- Jarvis maintains conversation continuity via local memory sessions
- Continuous runtime (Phase 99) supports background monitoring commands
- Reconnect indicator shows recovery without exposing internal runtime names

## Success criteria

- Voice feels natural with wake word + interruption support
- Browser workflows complete with visible progress
- Real providers stream reliably with failover
- Extended sessions remain responsive

See [REAL_WORLD_VALIDATION.md](./REAL_WORLD_VALIDATION.md) for test commands and validation modules.

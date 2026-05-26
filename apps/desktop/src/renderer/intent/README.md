# Desktop intent classification (Phase 24)

Deterministic pre-submit routing for Chat → `POST /tasks`.

## Flow

```
User message → classifyChatIntent() → IntentBadge in UI → POST /tasks
```

## Intent types

| Chat intent | API `intent.kind` | Typical agent |
|-------------|-------------------|---------------|
| `plan` | `plan` | Hermes |
| `research` | `research` | Hermes |
| `search` | `research` | Hermes (search skill) |
| `automate` | `automate` | OpenClaw |
| `conversation` | `default` | Hermes (stub) |

API allowed kinds are unchanged (`automate`, `plan`, `research`, `draft`, `default`). Desktop maps `search` → `research` and `conversation` → `default`, and stores the classified intent in `metadata` / `intent.parameters`.

## Rules

- Keyword/phrase rules only — **no LLM**
- First matching rule wins
- Same input → same classification

## Tests

```bash
npm run test --workspace=@jarvis/desktop
```

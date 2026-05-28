# Jarvis OS Memory & Context Intelligence

Phase **93** — intelligent recall on top of orchestrator `memory/`, `context/`, and `memory-recall/` (no duplicate storage).

## Architecture

```
Task execution
  → MemoryContextEngine (build + rank + cache)
  → ContextRelevanceRanker (scoring rules + decay)
  → AdaptiveMemoryRecall (dedupe + inject)
  → ConversationContinuityRuntime → SessionMemoryProfile (@jarvis/local-memory)
  → AgentContext metadata → Hermes planning
  → Task output memoryRecall (user-facing)
  → Desktop MemoryContextIndicator
```

## Scoring dimensions

| Dimension | Rule id |
|-----------|---------|
| Recency | `recency` |
| Intent keywords | `intent-keyword-match` |
| Task continuity | `task-id-match` |
| Execution relevance | `execution-relevance` |
| Conversation continuity | `conversation-continuity` |
| Semantic overlap | `semantic-relevance` |
| Stale context decay | `memory-decay` |

## User-facing copy

- Task output: `memoryRecall.message` = **"Remembered context"**
- Desktop: subtle purple dot indicator — no internal runtime names

## Module paths

| Module | Path |
|--------|------|
| Memory intelligence | `services/orchestrator/src/memory-intelligence/` |
| Session profiles | `services/local-memory/src/session-memory-profile*.ts` |
| Hermes recall bridge | `agents/hermes/src/gateway/extract-recalled-context.ts` |
| Desktop indicator | `apps/desktop/src/renderer/memory/` |

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/memory-intelligence
npm run test --workspace=@jarvis/local-memory -- --run session-memory-profile
npm run test --workspace=@jarvis/hermes -- --run extract-recalled-context
npm run test --workspace=@jarvis/desktop -- --run src/renderer/memory
```

## Legacy mode

```typescript
createDefaultContextRuntimeBundle({ useMemoryIntelligence: false });
```

Phase README: `services/orchestrator/src/memory-intelligence/PHASE-93-README.md`

## Workforce sessions (Phase 97)

Multi-agent tasks persist workforce session metadata via `services/local-memory/src/workforce-session-store.ts`:

- Type: `workforce-session`
- API: `saveWorkforceSession`, `loadWorkforceSession`, `listWorkforceSessions`
- Shared context ref links workers to conversation/task context

Tests: `npm run test --workspace=@jarvis/local-memory -- --run workforce-session-store`

# Phase 93 — Memory & Context Intelligence

Intelligent conversational continuity on top of existing `memory/`, `context/`, and `memory-recall/` layers — **no duplicate storage systems**.

## Modules

| Module | Role |
|--------|------|
| `MemoryContextEngine` | Build + rank context with safe cache |
| `ContextRelevanceRanker` | Recency, semantic, execution, continuity, decay scoring |
| `ConversationContinuityRuntime` | Multi-session profiles + linked conversations |
| `AdaptiveMemoryRecall` | Adaptive recall + dedupe + user-facing metadata |
| `SessionMemoryProfile` | `@jarvis/local-memory` persisted profile |

## Scoring rules

- Intent keyword overlap (Phase 65)
- Task id match
- Recency
- Execution relevance (plan/automate)
- Conversation continuity
- Semantic overlap
- Memory decay (stale turns)

## User-facing output

Task output `memoryRecall.message`: **"Remembered context"**  
Desktop: `MemoryContextIndicator` (subtle purple dot)

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator -- --run src/memory-intelligence
npm run test --workspace=@jarvis/local-memory -- --run session-memory-profile
npm run test --workspace=@jarvis/hermes -- --run extract-recalled-context
npm run test --workspace=@jarvis/desktop -- --run src/renderer/memory
```

## Disable intelligence (legacy ranker)

```typescript
createDefaultContextRuntimeBundle({ useMemoryIntelligence: false });
```

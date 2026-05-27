# Conversation workspace (Phase 76)

```
Desktop Chat → ConversationWorkspaceRuntime → Memory Recall + Timeline → Workspace View
```

Composes conversation history, memory recall, and timeline runtimes without duplicate storage.

## Exports

| Export | Role |
|--------|------|
| `WorkspaceSession` | Session with history, memories, timeline, runtime state |
| `ConversationWorkspaceRuntime` | Session lifecycle contract |
| `createDefaultConversationWorkspaceRuntime()` | Factory |

## Tests

```bash
npm run test --workspace=@jarvis/orchestrator
```

# Conversation workspace (Phase 76)

```
Desktop Chat → useConversationWorkspace → Execution Timeline + Memory → Workspace View
```

Persistent chat workspace with session management, history, task timeline, and related memories.

## Components

| Export | Role |
|--------|------|
| `ConversationWorkspace` | Full chat + workspace layout |
| `WorkspaceSidebar` | Session list and controls |
| `WorkspaceSessionPanel` | Active session details |
| `useConversationWorkspace()` | Session state + timeline composition |

## Tests

```bash
npm run test --workspace=@jarvis/desktop
```

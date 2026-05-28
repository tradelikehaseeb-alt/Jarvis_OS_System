# Autonomous Jarvis Runtime

Documents the continuous and background execution layer (Phases 97–99) that supports Phase 100 real-world validation.

## Layers

| Phase | Capability |
|-------|------------|
| **97** | Multi-agent workforce — parallel specialized workers |
| **98** | Daily productivity — email, tasks, scheduling, research |
| **99** | Continuous runtime — background monitoring, proactive notifications |
| **100** | Real-world validation — proves daily usability |

## Architecture (unchanged)

```
UI → API → Orchestrator → Agents → Skills
```

- **Hermes** — reasoning and planning
- **OpenClaw** — execution engine (browser, desktop)
- **Jarvis** — experience layer (user never sees internal names)

## Continuous behavior

- Persistent sessions via `PersistentSessionManager`
- Background task supervision with timeout and stall recovery
- Smart notification throttling
- Scheduled briefings and monitors

## Safety

- Permission-aware proactive actions
- Anti-loop protections from workflow supervisors
- Safe background automation limits
- No uncontrolled autonomous loops

See [CONTINUOUS.md](./CONTINUOUS.md), [AGENTS.md](./AGENTS.md), [PRODUCTIVITY.md](./PRODUCTIVITY.md).

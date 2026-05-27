# Transport runtime (Phase 52)

Pluggable event transport boundary beneath orchestrator streaming.

```
Orchestrator → StreamManager → TransportRuntime → TransportProvider → Subscribers
```

## Exports

| Export | Role |
|--------|------|
| `TransportProvider` | `publish`, `subscribe`, `unsubscribe`, `getHealth`, `getActiveSessions` |
| `TransportMessage` | Stream event message envelope |
| `TransportSession` | Active stream session metadata |
| `TransportHealth` | Provider health snapshot |
| `TransportRuntime` | Facade over `TransportProviderRegistry` |
| `InMemoryTransportProvider` | Default in-memory backend |
| `LocalEventTransportProvider` | Process-local JSON file persistence |
| `TransportProviderRegistry` | Register and resolve providers |
| `createDefaultTransportRuntime()` | In-memory default |
| `createLocalEventTransportRuntime(path)` | Local file-backed default |

## Streaming integration

`TransportBackedStreamManager` implements `StreamManager` using `TransportRuntime`.
`createDefaultStreamManager()` uses in-memory transport by default.
`createLocalEventStreamManager(path)` enables local file transport.

## Constraints

- No WebSockets or API changes
- In-memory stream remains default
- Desktop, Hermes, OpenClaw, and speech-service unchanged

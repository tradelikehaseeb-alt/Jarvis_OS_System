# @jarvis/api-runtime

TypeScript HTTP API runtime — Desktop → Orchestrator server boundary (Phase 53).

```
Desktop → HTTP → JarvisApiServer → Orchestrator → Hermes/OpenClaw → Response
```

## Endpoints

| Method | Path | Role |
|--------|------|------|
| `GET` | `/health` | API + orchestrator health |
| `POST` | `/tasks` | Create task via orchestrator |
| `GET` | `/tasks/:id` | Task status |

## Usage

```typescript
import { createDefaultJarvisApiServer } from "@jarvis/api-runtime";

const server = await createDefaultJarvisApiServer({ port: 8000 });
await server.start();
// Desktop: JARVIS_API_URL=http://127.0.0.1:8000
await server.stop();
```

## Constraints

- No WebSockets, browser control, or LLM execution
- Preserves `@jarvis/types` API contracts
- Stubs remain functional via orchestrator test service
- Python api-gateway unchanged — this is the Node runtime path

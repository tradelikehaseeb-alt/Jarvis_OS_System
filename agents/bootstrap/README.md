# @jarvis/agents-bootstrap

Registers Hermes + OpenClaw and the Phase 13 concrete skill pipeline.

```typescript
import { registerDefaultAgents } from "@jarvis/agents-bootstrap";

const { registry, pipeline, hermes, openClaw } = await registerDefaultAgents();
```

Bindings: Hermes → `search-skill`; OpenClaw → `browser-skill`, `file-skill`.

Not used from api-gateway HTTP — orchestrator wiring only.

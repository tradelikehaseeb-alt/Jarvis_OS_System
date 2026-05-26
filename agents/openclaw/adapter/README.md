# OpenClaw adapter (Phase 16)

Integration boundary for the **official OpenClaw gateway** — execution stays behind this adapter and Jarvis skills.

## Types

| Symbol | Role |
|--------|------|
| `OpenClawAdapter` | Interface — `invoke(request, config?)` |
| `OpenClawRequest` | Execution intent input |
| `OpenClawResponse` | Gateway acceptance + approved actions |
| `OpenClawConfig` | `stub` \| `official`, sandbox flags |
| `OpenClawAdapterStub` | Static mock implementation |

## Flow

```
Orchestrator → OpenClawAgent → OpenClawAdapter.invoke() → (stub | future official)
                          ↘ SkillExecutor → BrowserSkill, FileSkill
```

## Usage

```typescript
import { createOpenClawAdapterStub, createOpenClawAgent } from "@jarvis/openclaw";

const adapter = createOpenClawAdapterStub();
const agent = createOpenClawAgent(skillExecutor, adapter);
```

### With provider registry (Phase 17)

```typescript
import { createDefaultProviderResolver } from "@jarvis/provider-registry";
import { createOpenClawAdapterFromProvider, createOpenClawAgent } from "@jarvis/openclaw";

const resolver = createDefaultProviderResolver();
const agent = createOpenClawAgent(skillExecutor, createOpenClawAdapterFromProvider(resolver));
```

## Rules

- No copied OpenClaw source in this repo
- No real browser or desktop automation in stub mode
- Frontend never calls OpenClaw directly

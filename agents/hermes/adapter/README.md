# Hermes adapter (Phase 16)

Integration boundary for **official Hermes** — Jarvis agents call `HermesAdapter`, not external SDKs directly.

## Types

| Symbol | Role |
|--------|------|
| `HermesAdapter` | Interface — `invoke(request, config?)` |
| `HermesRequest` | Planning input (from `AgentTask`) |
| `HermesResponse` | Plan + reasoning output |
| `HermesConfig` | `stub` \| `official` mode |
| `HermesAdapterStub` | Static mock implementation |
| `HermesPlanningAdapter` | Official planning spike — structured `{ goal, steps }` (Phase 22) |
| `HermesStructuredPlan` | Plan shape returned in `HermesResponse.plan` |

## Flow

```
Orchestrator → HermesAgent → HermesAdapter.invoke() → (stub | future official)
                         ↘ SkillExecutor → SearchSkill
```

## Usage

```typescript
import { createHermesAdapterStub, createHermesAgent } from "@jarvis/hermes";

const adapter = createHermesAdapterStub();
const agent = createHermesAgent(skillExecutor, adapter);
```

### With provider registry (Phase 17)

```typescript
import { createDefaultProviderResolver } from "@jarvis/provider-registry";
import { createHermesAdapterFromProvider, createHermesAgent } from "@jarvis/hermes";

const resolver = createDefaultProviderResolver();
const agent = createHermesAgent(skillExecutor, createHermesAdapterFromProvider(resolver));
```

## Rules

- No copied Hermes source in this repo
- **Planning spike:** `HermesPlanningAdapter` in `official/` — deterministic plans, no LLM
- Runtime discovery: `HermesRuntimeDiscoveryAdapter` (env probe only)
- Persistent memory remains Memory Service APIs only
- Persistent memory remains Memory Service APIs only

# @jarvis/provider-registry

Pluggable **provider selection** for Hermes and OpenClaw adapters (Phase 17).

Selects which external provider implementation to use **before** official integrations are wired. All resolutions return static/mock data only.

## Types

| Export | Role |
|--------|------|
| `ProviderType` | `hermes-local` \| `hermes-cloud` \| `openclaw-local` \| `openclaw-remote` |
| `ProviderMetadata` | Catalog entry (family, deployment, stub flag) |
| `ProviderConfig` | Active `hermesProviderId` + `openclawProviderId` |
| `ProviderRegistry` | Register / list / resolve metadata |
| `InMemoryProviderRegistry` | In-memory implementation |
| `ProviderResolver` | Resolve config → `ProviderResolution` (mock payload) |

## Usage

```typescript
import {
  createDefaultProviderResolver,
  DEFAULT_PROVIDER_CONFIG,
} from "@jarvis/provider-registry";

const resolver = createDefaultProviderResolver({
  ...DEFAULT_PROVIDER_CONFIG,
  hermesProviderId: "hermes-cloud",
});

const hermes = resolver.resolveHermes();
// hermes.metadata, hermes.stubPayload (mock)
```

## Flow

```
ProviderConfig
  → ProviderResolver
    → ProviderRegistry.resolve(providerId)
      → ProviderResolution (stub payload)
        → HermesAdapter / OpenClawAdapter (unchanged interfaces)
```

## Rules

- No API calls, LLM, browser, or desktop automation
- Does not replace `@jarvis/hermes` or `@jarvis/openclaw` adapter interfaces
- Official integrations register new metadata + swap adapter factories later

## Tests

```bash
npm run test --workspace=@jarvis/provider-registry
```

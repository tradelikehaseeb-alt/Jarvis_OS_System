# Provider Settings Runtime (Phase 83)

User provider configuration and API key management for Desktop Settings.

## Flow

```
Desktop Settings → ProviderSettingsRuntime → ProviderValidationRuntime → Hermes/OpenClaw
```

## API

| Symbol | Role |
|--------|------|
| `ProviderCredentialStore` | Persist API keys — never exposed in public status |
| `ProviderSettingsRuntime` | `saveApiKey()`, `validateApiKey()`, `selectProvider()`, `selectModel()`, `getProviderStatus()` |
| `createDefaultProviderSettingsRuntime()` | Factory wiring registry + storage |

## Storage

| Namespace | Content |
|-----------|---------|
| `llm-provider-settings` | Selected provider + models per user |
| `llm-provider-credentials` | API keys (internal only) |

Env vars remain a valid fallback for local development and CI.

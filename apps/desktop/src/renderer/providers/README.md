# Provider Settings UI (Phase 83)

Desktop settings for configuring real LLM providers.

## Flow

```
SettingsPage → ProviderSettingsPage → IPC → ProviderSettingsRuntime → Hermes/OpenClaw
```

## Components

| Component | Role |
|-----------|------|
| `ProviderSettingsPage` | Settings section with provider grid |
| `ProviderCard` | Provider name, status, model, activation |
| `ProviderModelSelector` | Model dropdown |
| `ApiKeyManager` | Masked key input — never displays stored keys |
| `useProviderSettings()` | Load/save/validate hook |

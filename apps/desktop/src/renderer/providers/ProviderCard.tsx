import { ApiKeyManager } from "./ApiKeyManager";
import { ProviderModelSelector } from "./ProviderModelSelector";
import type { ProviderStatus } from "./provider-settings-types";

export interface ProviderCardProps {
  readonly provider: ProviderStatus;
  readonly disabled?: boolean;
  readonly onActivate: (providerId: string) => void;
  readonly onModelChange: (providerId: string, model: string) => void;
  readonly onSaveApiKey: (
    providerId: string,
    apiKey: string,
  ) => Promise<{ valid: boolean; message: string }>;
  readonly onValidateApiKey?: (
    providerId: string,
    apiKey: string,
  ) => Promise<{ valid: boolean; message: string }>;
}

function connectionLabel(provider: ProviderStatus): string {
  if (provider.stub) {
    return "Stub fallback";
  }
  if (provider.valid) {
    return "Connected";
  }
  if (provider.configured) {
    return "Configured";
  }
  return "Not configured";
}

/** Single provider configuration card (Phase 83). */
export function ProviderCard({
  provider,
  disabled = false,
  onActivate,
  onModelChange,
  onSaveApiKey,
  onValidateApiKey,
}: ProviderCardProps) {
  const showApiKey = provider.kind !== "ollama" && provider.kind !== "stub";

  return (
    <article
      className={`provider-card${provider.active ? " provider-card-active" : ""}`}
      data-testid={`provider-card-${provider.providerId}`}
    >
      <header className="provider-card-header">
        <div>
          <h4 className="provider-card-title">{provider.label}</h4>
          <p className="provider-card-id">{provider.providerId}</p>
        </div>
        <span
          className={`provider-status-badge provider-status-${provider.valid ? "ok" : "stub"}`}
          data-testid={`provider-status-${provider.providerId}`}
        >
          {connectionLabel(provider)}
        </span>
      </header>

      <p className="provider-card-message">{provider.message}</p>

      <ProviderModelSelector
        providerId={provider.providerId}
        models={provider.availableModels}
        selectedModel={provider.selectedModel}
        disabled={disabled}
        onChange={(model) => onModelChange(provider.providerId, model)}
      />

      {showApiKey ? (
        <ApiKeyManager
          providerId={provider.providerId}
          configured={provider.configured}
          disabled={disabled}
          onSave={(apiKey) => onSaveApiKey(provider.providerId, apiKey)}
          onValidate={
            onValidateApiKey
              ? (apiKey) => onValidateApiKey(provider.providerId, apiKey)
              : undefined
          }
        />
      ) : null}

      <button
        type="button"
        className={`btn ${provider.active ? "btn-secondary" : "btn-primary"}`}
        disabled={disabled || provider.active}
        onClick={() => onActivate(provider.providerId)}
      >
        {provider.active ? "Active provider" : "Use this provider"}
      </button>
    </article>
  );
}

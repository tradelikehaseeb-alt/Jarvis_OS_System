import { ProviderCard } from "./ProviderCard";
import { useProviderSettings } from "./use-provider-settings";

/** Desktop provider settings section (Phase 83). */
export function ProviderSettingsPage() {
  const {
    providers,
    activeProviderId,
    loading,
    saving,
    error,
    saveApiKey,
    validateKey,
    setActiveProvider,
    setProviderModel,
  } = useProviderSettings();

  if (loading) {
    return (
      <section
        className="settings-providers-section"
        aria-labelledby="settings-providers-heading"
        data-testid="provider-settings-page"
      >
        <h3 id="settings-providers-heading">AI Providers</h3>
        <p className="settings-providers-loading">Loading providers…</p>
      </section>
    );
  }

  const activeProvider = providers.find(
    (entry) => entry.providerId === activeProviderId,
  );

  return (
    <section
      className="settings-providers-section"
      aria-labelledby="settings-providers-heading"
      data-testid="provider-settings-page"
    >
      <h3 id="settings-providers-heading">AI Providers</h3>
      <p className="settings-providers-note">
        Configure real LLM providers for Hermes planning. API keys are stored locally
        and never shown after save.
      </p>

      {error ? <p className="settings-providers-error">{error}</p> : null}

      <p className="settings-providers-active">
        Active provider:{" "}
        <strong data-testid="active-provider-label">
          {activeProvider?.label ?? activeProviderId ?? "None"}
        </strong>
      </p>

      <div className="provider-card-grid">
        {providers
          .filter((provider) => provider.kind !== "stub")
          .map((provider) => (
            <ProviderCard
              key={provider.providerId}
              provider={provider}
              disabled={saving}
              onActivate={(providerId) => void setActiveProvider(providerId)}
              onModelChange={(providerId, model) =>
                void setProviderModel(providerId, model)
              }
              onSaveApiKey={saveApiKey}
              onValidateApiKey={(providerId, apiKey) =>
                validateKey(providerId, apiKey)
              }
            />
          ))}
      </div>
    </section>
  );
}

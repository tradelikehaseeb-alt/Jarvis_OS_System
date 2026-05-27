import { readEnvApiKey } from "./read-env-api-key";
import type { ProviderConfiguration } from "./provider-configuration";
import type { ProviderCredentialStore } from "./provider-credential-store";

/** Resolve API key from explicit input, credential store, then env (Phase 83). */
export function resolveProviderApiKey(
  configuration: ProviderConfiguration,
  credentialStore: ProviderCredentialStore,
  userId: string,
  explicit?: string,
): string | undefined {
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    return explicit.trim();
  }

  const stored = credentialStore.getApiKey(userId, configuration.providerId);
  if (stored) {
    return stored;
  }

  return readEnvApiKey(configuration.apiKeyEnvVars);
}

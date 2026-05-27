import type { LlmProviderKind } from "../llm-provider";

/** Persisted user provider preferences (Phase 83). */
export interface ProviderSettings {
  readonly userId: string;
  readonly selectedProviderId: string;
  readonly selectedModels: Readonly<Record<string, string>>;
  readonly updatedAt: string;
}

/** Public provider status — never includes raw API keys (Phase 83). */
export interface ProviderStatus {
  readonly providerId: string;
  readonly label: string;
  readonly kind: LlmProviderKind;
  readonly configured: boolean;
  readonly valid: boolean;
  readonly stub: boolean;
  readonly active: boolean;
  readonly message: string;
  readonly selectedModel: string;
  readonly availableModels: readonly string[];
}

export const PROVIDER_SETTINGS_NAMESPACE = "llm-provider-settings" as const;
export const PROVIDER_CREDENTIALS_NAMESPACE = "llm-provider-credentials" as const;

export const DEFAULT_DESKTOP_USER_ID = "desktop-user" as const;

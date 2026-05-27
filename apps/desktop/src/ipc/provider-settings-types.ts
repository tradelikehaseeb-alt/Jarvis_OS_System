import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderStatus,
} from "@jarvis/orchestrator";

export type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderStatus,
};

export interface ProviderSettingsSnapshot {
  readonly settings: ProviderSettings;
  readonly providers: readonly ProviderStatus[];
}

export interface SaveProviderApiKeyRequest {
  readonly userId: string;
  readonly providerId: string;
  readonly apiKey: string;
}

export interface SelectProviderRequest {
  readonly userId: string;
  readonly providerId: string;
}

export interface SelectProviderModelRequest {
  readonly userId: string;
  readonly providerId: string;
  readonly model: string;
}

export const DEFAULT_PROVIDER_SETTINGS_USER_ID = "desktop-user" as const;

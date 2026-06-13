import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderStatus,
} from "@jarvis/orchestrator";
import type { JarvisClientLocale } from "@jarvis/provider-runtime";

export type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderStatus,
  JarvisClientLocale,
};

export interface ProviderSettingsSnapshot {
  readonly settings: ProviderSettings;
  readonly providers: readonly ProviderStatus[];
  readonly locale?: JarvisClientLocale;
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

export interface SyncClientLocaleRequest {
  readonly userId: string;
  readonly timeZone?: string;
  readonly locale?: string;
  readonly cityLabel?: string;
}

export const DEFAULT_PROVIDER_SETTINGS_USER_ID = "desktop-user" as const;

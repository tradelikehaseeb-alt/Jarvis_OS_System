import type { JarvisDesktopApi } from "../global";

import type {
  ApiKeyValidationResult,
  ProviderSettings,
  ProviderSettingsSnapshot,
  SaveProviderApiKeyRequest,
  SelectProviderModelRequest,
  SelectProviderRequest,
} from "./provider-settings-types";

function getBridge(): JarvisDesktopApi {
  if (!window.jarvis) {
    throw new Error("Jarvis desktop bridge unavailable");
  }
  return window.jarvis;
}

/** Fetch provider settings snapshot via IPC (Phase 83). */
export async function fetchProviderSettings(
  userId: string,
): Promise<ProviderSettingsSnapshot> {
  return getBridge().getProviderSettings(userId);
}

/** Save and validate provider API key (Phase 83). */
export async function saveProviderApiKey(
  request: SaveProviderApiKeyRequest,
): Promise<ApiKeyValidationResult> {
  return getBridge().saveProviderApiKey(request);
}

/** Validate provider API key without persisting (Phase 83). */
export async function validateProviderApiKey(
  userId: string,
  providerId: string,
  apiKey?: string,
): Promise<ApiKeyValidationResult> {
  return getBridge().validateProviderApiKey({ userId, providerId, apiKey });
}

/** Select active LLM provider (Phase 83). */
export async function selectProvider(
  request: SelectProviderRequest,
): Promise<ProviderSettings> {
  return getBridge().selectProvider(request);
}

/** Select model for a provider (Phase 83). */
export async function selectProviderModel(
  request: SelectProviderModelRequest,
): Promise<ProviderSettings> {
  return getBridge().selectProviderModel(request);
}

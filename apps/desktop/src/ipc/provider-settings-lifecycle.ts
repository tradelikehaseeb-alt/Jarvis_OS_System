import {
  createDefaultProviderSettingsRuntime,
  type ProviderSettingsRuntime,
} from "@jarvis/orchestrator";

import type {
  ProviderSettingsSnapshot,
  SaveProviderApiKeyRequest,
  SelectProviderModelRequest,
  SelectProviderRequest,
} from "./provider-settings-types";

let runtime: ProviderSettingsRuntime | undefined;

function getProviderSettingsRuntime(): ProviderSettingsRuntime {
  if (!runtime) {
    runtime = createDefaultProviderSettingsRuntime();
  }
  return runtime;
}

/** @internal test hook */
export function __resetProviderSettingsRuntimeForTest(): void {
  runtime = undefined;
}

/** Load provider settings snapshot for desktop UI (Phase 83). */
export async function getProviderSettingsSnapshot(
  userId: string,
): Promise<ProviderSettingsSnapshot> {
  const settingsRuntime = getProviderSettingsRuntime();
  const [settings, providers] = await Promise.all([
    Promise.resolve(settingsRuntime.getSettings(userId)),
    settingsRuntime.listProviderStatuses(userId),
  ]);

  return { settings, providers };
}

export async function saveProviderApiKeyForUser(
  request: SaveProviderApiKeyRequest,
) {
  return getProviderSettingsRuntime().saveApiKey(
    request.userId,
    request.providerId,
    request.apiKey,
  );
}

export async function validateProviderApiKeyForUser(
  userId: string,
  providerId: string,
  apiKey?: string,
) {
  return getProviderSettingsRuntime().validateApiKey(userId, providerId, apiKey);
}

export async function selectProviderForUser(request: SelectProviderRequest) {
  return getProviderSettingsRuntime().selectProvider(
    request.userId,
    request.providerId,
  );
}

export async function selectProviderModelForUser(
  request: SelectProviderModelRequest,
) {
  return getProviderSettingsRuntime().selectModel(
    request.userId,
    request.providerId,
    request.model,
  );
}

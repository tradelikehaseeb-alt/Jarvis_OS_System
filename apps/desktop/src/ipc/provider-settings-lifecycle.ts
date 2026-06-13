import {
  createDefaultProviderSettingsRuntime,
  type ProviderSettingsRuntime,
} from "@jarvis/orchestrator";
import {
  getProviderFactory,
  type JarvisClientLocale,
  type ProviderFactorySelection,
} from "@jarvis/provider-runtime";

import type {
  ProviderSettingsSnapshot,
  SaveProviderApiKeyRequest,
  SelectProviderModelRequest,
  SelectProviderRequest,
} from "./provider-settings-types";

let runtime: ProviderSettingsRuntime | undefined;

function getProviderSettingsRuntime(): ProviderSettingsRuntime {
  if (!runtime) {
    const factory = getProviderFactory();
    runtime = createDefaultProviderSettingsRuntime({
      providerRuntime: factory.getRuntime(),
    });
  }
  return runtime;
}

async function reallocateProviderRuntime(
  selection: ProviderFactorySelection,
): Promise<void> {
  const factory = getProviderFactory();
  await factory.configure(selection);
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

  const factory = getProviderFactory();
  await reallocateProviderRuntime({
    userId,
    providerId: settings.selectedProviderId,
    model: settings.selectedModels[settings.selectedProviderId],
  });

  return {
    settings,
    providers,
    locale: factory.getLocale(),
  };
}

export async function saveProviderApiKeyForUser(
  request: SaveProviderApiKeyRequest,
) {
  const result = await getProviderSettingsRuntime().saveApiKey(
    request.userId,
    request.providerId,
    request.apiKey,
  );

  const settings = getProviderSettingsRuntime().getSettings(request.userId);
  await reallocateProviderRuntime({
    userId: request.userId,
    providerId: settings.selectedProviderId,
    model: settings.selectedModels[settings.selectedProviderId],
    apiKey: request.apiKey,
  });

  return result;
}

export async function validateProviderApiKeyForUser(
  userId: string,
  providerId: string,
  apiKey?: string,
) {
  return getProviderSettingsRuntime().validateApiKey(userId, providerId, apiKey);
}

export async function selectProviderForUser(request: SelectProviderRequest) {
  const settings = getProviderSettingsRuntime().selectProvider(
    request.userId,
    request.providerId,
  );

  await reallocateProviderRuntime({
    userId: request.userId,
    providerId: request.providerId,
    model: settings.selectedModels[request.providerId],
  });

  return settings;
}

export async function selectProviderModelForUser(
  request: SelectProviderModelRequest,
) {
  const settings = getProviderSettingsRuntime().selectModel(
    request.userId,
    request.providerId,
    request.model,
  );

  await reallocateProviderRuntime({
    userId: request.userId,
    providerId: request.providerId,
    model: request.model,
  });

  return settings;
}

/** Sync renderer locale (timezone/city) into the provider factory on boot. */
export async function syncClientLocaleForUser(
  userId: string,
  locale: Partial<JarvisClientLocale>,
): Promise<JarvisClientLocale> {
  const factory = getProviderFactory();
  const resolved = factory.setClientLocale(locale);
  const settings = getProviderSettingsRuntime().getSettings(userId);
  await reallocateProviderRuntime({
    userId,
    providerId: settings.selectedProviderId,
    model: settings.selectedModels[settings.selectedProviderId],
  });
  return resolved;
}

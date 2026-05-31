import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import { resolveDefaultLlmProviderId } from "../llm-provider-utils";
import { resolveDefaultLiveLlmProviderId } from "../llm-provider-policy";
import type { StorageRuntime } from "../../storage-runtime/storage-runtime";
import { createDefaultStorageRuntime } from "../../storage-runtime/create-default-storage-runtime";

import type { ApiKeyValidationResult } from "./provider-validation-runtime";
import {
  createDefaultProviderValidationRuntime,
  type ProviderValidationRuntime,
} from "./provider-validation-runtime";
import {
  InMemoryProviderCredentialStore,
  StorageBackedProviderCredentialStore,
  type ProviderCredentialStore,
} from "./provider-credential-store";
import type { ProviderRegistry } from "./provider-registry";
import { registerDefaultLlmProviders } from "./register-default-providers";
import {
  DEFAULT_DESKTOP_USER_ID,
  PROVIDER_SETTINGS_NAMESPACE,
  type ProviderSettings,
  type ProviderStatus,
} from "./provider-settings-types";
import { resolveProviderApiKey } from "./resolve-provider-api-key";

export interface ProviderSettingsRuntime {
  saveApiKey(
    userId: string,
    providerId: string,
    apiKey: string,
  ): Promise<ApiKeyValidationResult>;
  validateApiKey(
    userId: string,
    providerId: string,
    apiKey?: string,
  ): Promise<ApiKeyValidationResult>;
  selectProvider(userId: string, providerId: string): ProviderSettings;
  selectModel(userId: string, providerId: string, model: string): ProviderSettings;
  getProviderStatus(userId: string, providerId: string): Promise<ProviderStatus>;
  listProviderStatuses(userId: string): Promise<readonly ProviderStatus[]>;
  getSettings(userId: string): ProviderSettings;
  resolveProviderId(
    userId: string,
    metadata?: Readonly<Record<string, unknown>>,
  ): string;
  resolveModel(userId: string, providerId: string, requestModel?: string): string;
  resolveApiKeyForExecution(userId: string, providerId: string): string | undefined;
  executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse>;
  streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse>;
}

export interface CreateDefaultProviderSettingsRuntimeOptions {
  readonly validationRuntime?: ProviderValidationRuntime;
  readonly credentialStore?: ProviderCredentialStore;
  readonly storageRuntime?: StorageRuntime;
  readonly registry?: ProviderRegistry;
  readonly fallbackProviderId?: string;
}

function defaultSettings(userId: string, fallbackProviderId: string): ProviderSettings {
  return {
    userId,
    selectedProviderId: fallbackProviderId,
    selectedModels: {},
    updatedAt: new Date().toISOString(),
  };
}

class DefaultProviderSettingsRuntime implements ProviderSettingsRuntime {
  private readonly validationRuntime: ProviderValidationRuntime;
  private readonly credentialStore: ProviderCredentialStore;
  private readonly storageRuntime: StorageRuntime;
  private readonly fallbackProviderId: string;

  constructor(private readonly options: CreateDefaultProviderSettingsRuntimeOptions) {
    this.validationRuntime =
      options.validationRuntime ??
      createDefaultProviderValidationRuntime({
        registry: options.registry,
      });
    this.storageRuntime = options.storageRuntime ?? createDefaultStorageRuntime();
    this.credentialStore =
      options.credentialStore ??
      new StorageBackedProviderCredentialStore(this.storageRuntime);
    this.fallbackProviderId =
      options.fallbackProviderId ?? resolveDefaultLiveLlmProviderId();
  }

  async saveApiKey(
    userId: string,
    providerId: string,
    apiKey: string,
  ): Promise<ApiKeyValidationResult> {
    const trimmed = apiKey.trim();
    const validation = await this.validateApiKey(userId, providerId, trimmed);

    if (validation.valid && !validation.stub) {
      this.credentialStore.saveApiKey(userId, providerId, trimmed);
    }

    return validation;
  }

  async validateApiKey(
    userId: string,
    providerId: string,
    apiKey?: string,
  ): Promise<ApiKeyValidationResult> {
    const configuration = this.validationRuntime.getConfiguration(providerId);

    if (!configuration) {
      return {
        valid: false,
        providerId,
        stub: true,
        message: `Unknown provider: ${providerId}`,
      };
    }

    const resolved = resolveProviderApiKey(
      configuration,
      this.credentialStore,
      userId,
      apiKey,
    );

    return this.validationRuntime.validateApiKey(providerId, resolved);
  }

  selectProvider(userId: string, providerId: string): ProviderSettings {
    const configuration = this.validationRuntime.getConfiguration(providerId);
    if (!configuration) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    const current = this.getSettings(userId);
    const updatedAt = new Date().toISOString();
    const next: ProviderSettings = {
      ...current,
      selectedProviderId: providerId,
      updatedAt,
    };

    this.persistSettings(next);
    return next;
  }

  selectModel(userId: string, providerId: string, model: string): ProviderSettings {
    const configuration = this.validationRuntime.getConfiguration(providerId);
    if (!configuration) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    const available = configuration.availableModels;
    if (!available.includes(model)) {
      throw new Error(`Model not available for ${providerId}: ${model}`);
    }

    const current = this.getSettings(userId);
    const updatedAt = new Date().toISOString();
    const next: ProviderSettings = {
      ...current,
      selectedModels: {
        ...current.selectedModels,
        [providerId]: model,
      },
      updatedAt,
    };

    this.persistSettings(next);
    return next;
  }

  async getProviderStatus(
    userId: string,
    providerId: string,
  ): Promise<ProviderStatus> {
    const configuration = this.validationRuntime.getConfiguration(providerId);
    const settings = this.getSettings(userId);

    if (!configuration) {
      return {
        providerId,
        label: providerId,
        kind: "stub",
        configured: false,
        valid: false,
        stub: true,
        active: false,
        message: `Unknown provider: ${providerId}`,
        selectedModel: "",
        availableModels: [],
      };
    }

    if (configuration.kind === "stub") {
      return {
        providerId,
        label: configuration.label,
        kind: configuration.kind,
        configured: true,
        valid: true,
        stub: true,
        active: settings.selectedProviderId === providerId,
        message: "Deterministic stub LLM provider ready",
        selectedModel:
          settings.selectedModels[providerId] ?? configuration.defaultModel,
        availableModels: configuration.availableModels,
      };
    }

    const validation = await this.validateApiKey(userId, providerId);
    const stored = this.credentialStore.hasApiKey(userId, providerId);
    const envConfigured =
      configuration.kind === "ollama" ||
      Boolean(resolveProviderApiKey(configuration, this.credentialStore, userId));

    return {
      providerId,
      label: configuration.label,
      kind: configuration.kind,
      configured: stored || envConfigured,
      valid: validation.valid,
      stub: validation.stub,
      active: settings.selectedProviderId === providerId,
      message: validation.message,
      selectedModel:
        settings.selectedModels[providerId] ?? configuration.defaultModel,
      availableModels: configuration.availableModels,
    };
  }

  async listProviderStatuses(userId: string): Promise<readonly ProviderStatus[]> {
    const providers = this.validationRuntime.listProviders();
    return Promise.all(
      providers.map((entry) => this.getProviderStatus(userId, entry.providerId)),
    );
  }

  getSettings(userId: string): ProviderSettings {
    const record = this.storageRuntime.get(userId, PROVIDER_SETTINGS_NAMESPACE);
    if (!record) {
      return defaultSettings(userId, this.fallbackProviderId);
    }

    const data = record.data;
    const selectedProviderId =
      typeof data.selectedProviderId === "string"
        ? data.selectedProviderId
        : this.fallbackProviderId;
    const selectedModels =
      typeof data.selectedModels === "object" && data.selectedModels !== null
        ? (data.selectedModels as Record<string, string>)
        : {};

    return {
      userId,
      selectedProviderId,
      selectedModels,
      updatedAt:
        typeof data.updatedAt === "string"
          ? data.updatedAt
          : record.timestamp,
    };
  }

  resolveProviderId(
    userId: string,
    metadata?: Readonly<Record<string, unknown>>,
  ): string {
    const fromMetadata = metadata?.llmProviderId;
    if (typeof fromMetadata === "string" && fromMetadata.trim().length > 0) {
      return fromMetadata.trim();
    }

    const settings = this.getSettings(userId);
    if (settings.selectedProviderId !== this.fallbackProviderId) {
      return settings.selectedProviderId;
    }

    return resolveDefaultLlmProviderId(metadata);
  }

  resolveModel(
    userId: string,
    providerId: string,
    requestModel?: string,
  ): string {
    if (requestModel) {
      return requestModel;
    }

    const settings = this.getSettings(userId);
    const fromSettings = settings.selectedModels[providerId];
    if (fromSettings) {
      return fromSettings;
    }

    const configuration = this.validationRuntime.getConfiguration(providerId);
    return configuration?.defaultModel ?? "stub-model";
  }

  resolveApiKeyForExecution(userId: string, providerId: string): string | undefined {
    const configuration = this.validationRuntime.getConfiguration(providerId);
    if (!configuration) {
      return undefined;
    }

    return resolveProviderApiKey(configuration, this.credentialStore, userId);
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const userId = request.userId ?? DEFAULT_DESKTOP_USER_ID;
    const providerId =
      request.providerId.trim().length > 0
        ? request.providerId
        : this.resolveProviderId(userId, request.metadata);
    const model = this.resolveModel(userId, providerId, request.model);
    const providerApiKey = this.resolveApiKeyForExecution(userId, providerId);

    return this.validationRuntime.executePrompt({
      ...request,
      providerId,
      model,
      providerApiKey,
    });
  }

  async streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse> {
    const userId = request.userId ?? DEFAULT_DESKTOP_USER_ID;
    const providerId =
      request.providerId.trim().length > 0
        ? request.providerId
        : this.resolveProviderId(userId, request.metadata);
    const model = this.resolveModel(userId, providerId, request.model);
    const providerApiKey = this.resolveApiKeyForExecution(userId, providerId);

    return this.validationRuntime.streamResponse(
      {
        ...request,
        providerId,
        model,
        providerApiKey,
      },
      subscriber,
    );
  }

  private persistSettings(settings: ProviderSettings): void {
    this.storageRuntime.save({
      id: settings.userId,
      namespace: PROVIDER_SETTINGS_NAMESPACE,
      timestamp: settings.updatedAt,
      data: { ...settings },
      metadata: { userId: settings.userId },
    });
  }
}

/** Factory for provider settings runtime (Phase 83). */
export function createDefaultProviderSettingsRuntime(
  options: CreateDefaultProviderSettingsRuntimeOptions = {},
): ProviderSettingsRuntime {
  return new DefaultProviderSettingsRuntime(options);
}

/** @internal test helper — in-memory credentials + default registry */
export function createTestProviderSettingsRuntime(
  options: CreateDefaultProviderSettingsRuntimeOptions = {},
): ProviderSettingsRuntime {
  const storageRuntime = options.storageRuntime ?? createDefaultStorageRuntime();
  return createDefaultProviderSettingsRuntime({
    ...options,
    storageRuntime,
    credentialStore:
      options.credentialStore ??
      new InMemoryProviderCredentialStore(),
    registry: options.registry ?? registerDefaultLlmProviders(),
  });
}

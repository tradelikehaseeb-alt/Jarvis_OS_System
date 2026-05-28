import { resolveOllamaBaseUrl } from "../llm-provider-utils";
import type { ProviderConfiguration } from "../connectors/provider-configuration";
import {
  DEFAULT_CONNECTOR_CONFIGURATIONS,
  OLLAMA_PROVIDER_ID,
} from "../connectors/default-provider-configurations";
import type { ProviderRegistry } from "../connectors/provider-registry";
import { registerDefaultLlmProviders } from "../connectors/register-default-providers";
import type { ProviderSettingsRuntime } from "../connectors/create-default-provider-settings-runtime";
import {
  createTestProviderSettingsRuntime,
  createDefaultProviderSettingsRuntime,
} from "../connectors/create-default-provider-settings-runtime";
import { DEFAULT_API_USER_ID } from "../../task-execution/create-task-executor";

import type {
  ProviderConnectionStatus,
  ProviderHealthCheckResult,
} from "./provider-health-check-result";

export interface ProviderHealthValidationRuntime {
  validateProviderHealth(
    providerId: string,
    userId?: string,
  ): Promise<ProviderHealthCheckResult>;
  validateAllProviders(userId?: string): Promise<readonly ProviderHealthCheckResult[]>;
}

export interface CreateDefaultProviderHealthValidationRuntimeOptions {
  readonly providerSettingsRuntime?: ProviderSettingsRuntime;
  readonly registry?: ProviderRegistry;
  readonly userId?: string;
}

interface OllamaTagsResponse {
  readonly models?: readonly { readonly name?: string }[];
}

interface OpenAiModelsResponse {
  readonly data?: readonly { readonly id?: string }[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function resolveConnectionStatus(input: {
  readonly connected: boolean;
  readonly stub: boolean;
  readonly misconfigured: boolean;
}): ProviderConnectionStatus {
  if (input.misconfigured) {
    return "misconfigured";
  }
  if (input.stub) {
    return "stub";
  }
  if (input.connected) {
    return "connected";
  }
  return "unreachable";
}

async function probeOllamaHealth(
  configuration: ProviderConfiguration,
): Promise<{
  readonly connected: boolean;
  readonly availableModels: readonly string[];
  readonly latencyMs: number;
  readonly failureHandled: boolean;
  readonly message: string;
}> {
  const baseUrl = resolveOllamaBaseUrl();
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/tags`, { method: "GET" });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        connected: false,
        availableModels: configuration.availableModels,
        latencyMs,
        failureHandled: true,
        message: `Ollama unreachable (${response.status}) — stub fallback active`,
      };
    }

    const payload = (await response.json()) as OllamaTagsResponse;
    const discovered =
      payload.models
        ?.map((model) => model.name?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0)) ?? [];

    if (discovered.length === 0) {
      return {
        connected: true,
        availableModels: [],
        latencyMs,
        failureHandled: true,
        message: "Ollama running but no models installed — stub fallback active",
      };
    }

    const availableModels = discovered;

    return {
      connected: true,
      availableModels,
      latencyMs,
      failureHandled: true,
      message: `Ollama reachable at ${baseUrl}`,
    };
  } catch {
    return {
      connected: false,
      availableModels: configuration.availableModels,
      latencyMs: Date.now() - startedAt,
      failureHandled: true,
      message: "Ollama not running — stub fallback active",
    };
  }
}

async function probeOpenAiCompatibleHealth(
  configuration: ProviderConfiguration,
  apiKey: string | undefined,
): Promise<{
  readonly connected: boolean;
  readonly availableModels: readonly string[];
  readonly latencyMs: number;
  readonly failureHandled: boolean;
  readonly message: string;
  readonly stub: boolean;
}> {
  if (!apiKey) {
    return {
      connected: false,
      availableModels: configuration.availableModels,
      latencyMs: 0,
      failureHandled: true,
      stub: true,
      message: `${configuration.label} API key not configured — stub fallback active`,
    };
  }

  if (!configuration.baseUrl) {
    return {
      connected: false,
      availableModels: configuration.availableModels,
      latencyMs: 0,
      failureHandled: true,
      stub: true,
      message: `${configuration.label} base URL missing — misconfigured`,
    };
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`${configuration.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        connected: false,
        availableModels: configuration.availableModels,
        latencyMs,
        failureHandled: true,
        stub: false,
        message: `${configuration.label} models probe failed (${response.status})`,
      };
    }

    try {
      const payload = (await response.json()) as OpenAiModelsResponse;
      const discovered =
        payload.data
          ?.map((entry) => entry.id?.trim())
          .filter((id): id is string => Boolean(id && id.length > 0)) ?? [];

      return {
        connected: true,
        availableModels:
          discovered.length > 0 ? discovered : configuration.availableModels,
        latencyMs,
        failureHandled: true,
        stub: false,
        message: `${configuration.label} connected`,
      };
    } catch {
      return {
        connected: true,
        availableModels: configuration.availableModels,
        latencyMs,
        failureHandled: true,
        stub: false,
        message: `${configuration.label} connected (configured models fallback)`,
      };
    }
  } catch (error) {
    return {
      connected: false,
      availableModels: configuration.availableModels,
      latencyMs: Date.now() - startedAt,
      failureHandled: true,
      stub: false,
      message:
        error instanceof Error
          ? `${configuration.label} unreachable: ${error.message}`
          : `${configuration.label} unreachable`,
    };
  }
}

class DefaultProviderHealthValidationRuntime implements ProviderHealthValidationRuntime {
  private readonly providerSettingsRuntime: ProviderSettingsRuntime;
  private readonly registry: ProviderRegistry;
  private readonly defaultUserId: string;

  constructor(options: CreateDefaultProviderHealthValidationRuntimeOptions = {}) {
    this.providerSettingsRuntime =
      options.providerSettingsRuntime ?? createDefaultProviderSettingsRuntime();
    this.registry = options.registry ?? registerDefaultLlmProviders();
    this.defaultUserId = options.userId ?? DEFAULT_API_USER_ID;
  }

  async validateProviderHealth(
    providerId: string,
    userId?: string,
  ): Promise<ProviderHealthCheckResult> {
    const resolvedUserId = userId ?? this.defaultUserId;
    const configuration = this.registry.getConfiguration(providerId);

    if (!configuration) {
      return {
        providerId,
        label: providerId,
        connected: false,
        stub: true,
        connectionStatus: "misconfigured",
        availableModels: [],
        configuredModels: [],
        latencyMs: 0,
        failureHandled: true,
        message: `Unknown provider: ${providerId}`,
        checkedAt: nowIso(),
      };
    }

    const apiKey = this.providerSettingsRuntime.resolveApiKeyForExecution(
      resolvedUserId,
      providerId,
    );

    if (configuration.providerId === OLLAMA_PROVIDER_ID) {
      const probe = await probeOllamaHealth(configuration);
      const stub = !probe.connected || probe.availableModels.length === 0;

      return {
        providerId,
        label: configuration.label,
        connected: probe.connected,
        stub,
        connectionStatus: resolveConnectionStatus({
          connected: probe.connected,
          stub,
          misconfigured: false,
        }),
        availableModels: probe.availableModels,
        configuredModels: configuration.availableModels,
        latencyMs: probe.latencyMs,
        failureHandled: probe.failureHandled,
        message: probe.message,
        checkedAt: nowIso(),
      };
    }

    const probe = await probeOpenAiCompatibleHealth(configuration, apiKey);
    const stub = probe.stub || !probe.connected;

    return {
      providerId,
      label: configuration.label,
      connected: probe.connected,
      stub,
      connectionStatus: resolveConnectionStatus({
        connected: probe.connected,
        stub: probe.stub,
        misconfigured: !configuration.baseUrl,
      }),
      availableModels: probe.availableModels,
      configuredModels: configuration.availableModels,
      latencyMs: probe.latencyMs,
      failureHandled: probe.failureHandled,
      message: probe.message,
      checkedAt: nowIso(),
    };
  }

  async validateAllProviders(
    userId?: string,
  ): Promise<readonly ProviderHealthCheckResult[]> {
    const providerIds = DEFAULT_CONNECTOR_CONFIGURATIONS.map(
      (configuration) => configuration.providerId,
    );

    return Promise.all(
      providerIds.map((providerId) => this.validateProviderHealth(providerId, userId)),
    );
  }
}

/** Factory for provider health validation runtime (Phase 85). */
export function createDefaultProviderHealthValidationRuntime(
  options: CreateDefaultProviderHealthValidationRuntimeOptions = {},
): ProviderHealthValidationRuntime {
  return new DefaultProviderHealthValidationRuntime(options);
}

/** @internal test helper */
export function createTestProviderHealthValidationRuntime(
  options: CreateDefaultProviderHealthValidationRuntimeOptions = {},
): ProviderHealthValidationRuntime {
  return new DefaultProviderHealthValidationRuntime({
    ...options,
    providerSettingsRuntime:
      options.providerSettingsRuntime ?? createTestProviderSettingsRuntime(),
  });
}

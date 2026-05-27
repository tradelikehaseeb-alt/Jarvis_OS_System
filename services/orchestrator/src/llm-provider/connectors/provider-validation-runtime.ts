import type { ProviderRuntime } from "@jarvis/provider-runtime";

import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmProvider, LlmProviderValidation } from "../llm-provider";
import type { LlmProviderRuntime } from "../llm-provider-runtime";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import {
  createLlmProviderRuntimeFromProviders,
  type CreateDefaultLlmProviderRuntimeOptions,
} from "../create-default-llm-provider-runtime";

import { buildApiKeyValidation } from "./openai-compatible-executor";
import type { ProviderConfiguration } from "./provider-configuration";
import {
  InMemoryProviderRegistry,
  type ProviderRegistry,
} from "./provider-registry";
import { registerDefaultLlmProviders } from "./register-default-providers";

export interface ApiKeyValidationResult {
  readonly valid: boolean;
  readonly providerId: string;
  readonly stub: boolean;
  readonly message: string;
}

/**
 * Multi-provider validation and execution runtime (Phase 82).
 */
export interface ProviderValidationRuntime {
  registerProvider(provider: LlmProvider, configuration: ProviderConfiguration): void;
  validateApiKey(
    providerId: string,
    apiKey?: string,
  ): Promise<ApiKeyValidationResult>;
  getAvailableModels(providerId: string): Promise<readonly string[]>;
  executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse>;
  streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse>;
  listProviders(): ReturnType<LlmProviderRuntime["listProviders"]>;
  getConfiguration(providerId: string): ProviderConfiguration | undefined;
  validateProvider(providerId: string): Promise<LlmProviderValidation>;
  asLlmProviderRuntime(): LlmProviderRuntime;
}

export interface CreateDefaultProviderValidationRuntimeOptions
  extends CreateDefaultLlmProviderRuntimeOptions {
  readonly registry?: ProviderRegistry;
}

class DefaultProviderValidationRuntime implements ProviderValidationRuntime {
  private readonly registry: ProviderRegistry;
  private readonly llmRuntime: LlmProviderRuntime;

  constructor(options: CreateDefaultProviderValidationRuntimeOptions = {}) {
    this.registry = options.registry ?? registerDefaultLlmProviders();
    const providers = this.registry
      .listProviderIds()
      .map((providerId) => this.registry.getProvider(providerId))
      .filter((provider): provider is LlmProvider => provider !== undefined);

    this.llmRuntime = createLlmProviderRuntimeFromProviders(providers, options);
  }

  registerProvider(
    provider: LlmProvider,
    configuration: ProviderConfiguration,
  ): void {
    this.registry.registerProvider(provider, configuration);
  }

  async validateApiKey(
    providerId: string,
    apiKey?: string,
  ): Promise<ApiKeyValidationResult> {
    const configuration = this.registry.getConfiguration(providerId);
    const provider = this.registry.getProvider(providerId);

    if (!configuration || !provider) {
      return {
        valid: false,
        providerId,
        stub: true,
        message: `Unknown provider: ${providerId}`,
      };
    }

    if (configuration.kind === "ollama") {
      const validation = await provider.validateProvider();
      return {
        valid: validation.valid,
        providerId,
        stub: validation.stub,
        message: validation.message,
      };
    }

    const keyValidation = buildApiKeyValidation(configuration, apiKey);
    return {
      ...keyValidation,
      providerId,
    };
  }

  async getAvailableModels(providerId: string): Promise<readonly string[]> {
    const configuration = this.registry.getConfiguration(providerId);
    return configuration?.availableModels ?? [];
  }

  executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    return this.llmRuntime.executePrompt(request);
  }

  streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse> {
    return this.llmRuntime.streamResponse(request, subscriber);
  }

  listProviders(): ReturnType<LlmProviderRuntime["listProviders"]> {
    return this.llmRuntime.listProviders();
  }

  getConfiguration(providerId: string): ProviderConfiguration | undefined {
    return this.registry.getConfiguration(providerId);
  }

  validateProvider(providerId: string): Promise<LlmProviderValidation> {
    return this.llmRuntime.validateProvider(providerId);
  }

  asLlmProviderRuntime(): LlmProviderRuntime {
    return this.llmRuntime;
  }
}

/** Factory for multi-provider validation runtime (Phase 82). */
export function createDefaultProviderValidationRuntime(
  options: CreateDefaultProviderValidationRuntimeOptions = {},
): ProviderValidationRuntime {
  return new DefaultProviderValidationRuntime(options);
}

/** @internal test helper */
export function createEmptyProviderRegistryForTest(): ProviderRegistry {
  return new InMemoryProviderRegistry();
}

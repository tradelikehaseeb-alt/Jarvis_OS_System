import type { ProviderRuntime } from "@jarvis/provider-runtime";
import {
  DEFAULT_HERMES_PROVIDER_ID,
  validateProviderConnection,
} from "@jarvis/provider-runtime";

import type { LlmProviderRequest } from "./llm-provider-request";
import type { LlmProviderResponse } from "./llm-provider-response";
import {
  DEFAULT_STUB_LLM_PROVIDER_ID,
  type LlmProvider,
  type LlmProviderValidation,
} from "./llm-provider";
import type { LlmProviderRuntime } from "./llm-provider-runtime";
import { createStubLlmResponse } from "./llm-provider-utils";
import { OllamaLlmProvider } from "./providers/ollama-llm-provider";
import { OpenAiLlmProvider } from "./providers/openai-llm-provider";
import { StubLlmProvider } from "./providers/stub-llm-provider";
import type { LlmStreamSubscriber } from "./llm-stream-subscriber";

export interface CreateDefaultLlmProviderRuntimeOptions {
  readonly providers?: readonly LlmProvider[];
  readonly providerRuntime?: ProviderRuntime;
  readonly fallbackProviderId?: string;
}

class DefaultLlmProviderRuntime implements LlmProviderRuntime {
  private readonly providers = new Map<string, LlmProvider>();
  private readonly fallbackProviderId: string;

  constructor(private readonly options: CreateDefaultLlmProviderRuntimeOptions) {
    const defaults: LlmProvider[] = [
      new StubLlmProvider(),
      new OpenAiLlmProvider(),
      new OllamaLlmProvider(),
    ];
    for (const provider of options.providers ?? defaults) {
      this.providers.set(provider.providerId, provider);
    }
    this.fallbackProviderId =
      options.fallbackProviderId ?? DEFAULT_STUB_LLM_PROVIDER_ID;
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const provider = this.resolveProvider(request.providerId);
    const response = await provider.executePrompt({
      ...request,
      providerId: provider.providerId,
    });

    if (!response.success && provider.providerId !== this.fallbackProviderId) {
      const fallback = this.providers.get(this.fallbackProviderId);
      if (fallback) {
        return fallback.executePrompt({
          ...request,
          providerId: fallback.providerId,
        });
      }
    }

    return response;
  }

  async validateProvider(providerId: string): Promise<LlmProviderValidation> {
    const provider = this.resolveProvider(providerId);
    const validation = await provider.validateProvider();

    if (this.options.providerRuntime && provider.kind !== "stub") {
      const connected = await validateProviderConnection(
        this.options.providerRuntime,
        DEFAULT_HERMES_PROVIDER_ID,
      );
      if (!connected && validation.valid) {
        return {
          ...validation,
          valid: false,
          stub: true,
          message: `${validation.message}; Hermes provider connection unavailable — stub fallback`,
        };
      }
    }

    return validation;
  }

  async streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriber,
  ): Promise<LlmProviderResponse> {
    const provider = this.resolveProvider(request.providerId);
    const response = await provider.streamResponse(
      { ...request, providerId: provider.providerId },
      subscriber,
    );

    if (!response.success && provider.providerId !== this.fallbackProviderId) {
      const fallback = this.providers.get(this.fallbackProviderId);
      if (fallback) {
        return fallback.streamResponse(
          { ...request, providerId: fallback.providerId },
          subscriber,
        );
      }
    }

    return response;
  }

  listProviders(): ReturnType<LlmProviderRuntime["listProviders"]> {
    return [...this.providers.values()].map((provider) => ({
      providerId: provider.providerId,
      kind: provider.kind,
      label: provider.label,
    }));
  }

  private resolveProvider(providerId: string): LlmProvider {
    const provider =
      this.providers.get(providerId) ??
      this.providers.get(this.fallbackProviderId);

    if (!provider) {
      return new StubLlmProvider();
    }

    return provider;
  }
}

/** Factory for orchestrator LLM provider runtime (Phase 81). */
export function createDefaultLlmProviderRuntime(
  options: CreateDefaultLlmProviderRuntimeOptions = {},
): LlmProviderRuntime {
  return new DefaultLlmProviderRuntime(options);
}

/** @internal test helper */
export function __createUnknownProviderResponseForTest(
  request: LlmProviderRequest,
): LlmProviderResponse {
  return createStubLlmResponse(request, "stub", DEFAULT_STUB_LLM_PROVIDER_ID);
}

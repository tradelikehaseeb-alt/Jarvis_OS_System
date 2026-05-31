import type { ProviderRuntime } from "@jarvis/provider-runtime";
import {
  DEFAULT_HERMES_PROVIDER_ID,
  validateProviderConnection,
} from "@jarvis/provider-runtime";

import { GROQ_PROVIDER_ID } from "./connectors/default-provider-configurations";
import type { LlmProviderRequest } from "./llm-provider-request";
import type { LlmProviderResponse } from "./llm-provider-response";
import {
  DEFAULT_STUB_LLM_PROVIDER_ID,
  type LlmProvider,
  type LlmProviderValidation,
} from "./llm-provider";
import type { LlmProviderRuntime } from "./llm-provider-runtime";
import {
  allowLlmStubFallback,
  createNoLlmApiKeysResponse,
  hasAnyPrimaryLlmApiKey,
  resolveDefaultLiveLlmProviderId,
} from "./llm-provider-policy";
import { createDefaultProviderValidationRuntime } from "./connectors";
import { StubLlmProvider } from "./providers/stub-llm-provider";
import {
  normalizeLlmStreamSubscriber,
  type LlmStreamSubscriber,
  type LlmStreamSubscriberInput,
} from "./llm-stream-subscriber";

export interface CreateDefaultLlmProviderRuntimeOptions {
  readonly providers?: readonly LlmProvider[];
  readonly providerRuntime?: ProviderRuntime;
  readonly fallbackProviderId?: string;
}

function resolveRuntimeFallbackProviderId(
  options: CreateDefaultLlmProviderRuntimeOptions,
): string {
  if (options.fallbackProviderId) {
    return options.fallbackProviderId;
  }
  return resolveDefaultLiveLlmProviderId();
}

class DefaultLlmProviderRuntime implements LlmProviderRuntime {
  private readonly providers = new Map<string, LlmProvider>();
  private readonly fallbackProviderId: string;

  constructor(private readonly options: CreateDefaultLlmProviderRuntimeOptions) {
    for (const provider of options.providers ?? []) {
      this.providers.set(provider.providerId, provider);
    }
    this.fallbackProviderId = resolveRuntimeFallbackProviderId(options);
  }

  async executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const providerId = this.resolveRequestProviderId(request);
    if (
      !hasAnyPrimaryLlmApiKey() &&
      providerId !== DEFAULT_STUB_LLM_PROVIDER_ID &&
      !allowLlmStubFallback()
    ) {
      return createNoLlmApiKeysResponse(request, providerId);
    }

    const provider = this.resolveProvider(providerId);
    const response = await provider.executePrompt({
      ...request,
      providerId: provider.providerId,
    });

    if (
      allowLlmStubFallback() &&
      !response.success &&
      !response.stub &&
      provider.providerId !== DEFAULT_STUB_LLM_PROVIDER_ID
    ) {
      const stub = this.providers.get(DEFAULT_STUB_LLM_PROVIDER_ID);
      if (stub) {
        return stub.executePrompt({
          ...request,
          providerId: stub.providerId,
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
          stub: allowLlmStubFallback(),
          message: allowLlmStubFallback()
            ? `${validation.message}; Hermes provider connection unavailable — stub fallback`
            : `${validation.message}; Hermes provider connection unavailable`,
        };
      }
    }

    return validation;
  }

  async streamResponse(
    request: LlmProviderRequest,
    subscriber: LlmStreamSubscriberInput,
  ): Promise<LlmProviderResponse> {
    const normalized = normalizeLlmStreamSubscriber(
      subscriber,
      request.userId ?? request.taskId ?? "stream",
    );
    const providerId = this.resolveRequestProviderId(request);

    if (
      !hasAnyPrimaryLlmApiKey() &&
      providerId !== DEFAULT_STUB_LLM_PROVIDER_ID &&
      !allowLlmStubFallback()
    ) {
      return createNoLlmApiKeysResponse(request, providerId);
    }

    const provider = this.resolveProvider(providerId);
    const response = await provider.streamResponse(
      { ...request, providerId: provider.providerId },
      normalized,
    );

    if (
      allowLlmStubFallback() &&
      !response.success &&
      !response.stub &&
      provider.providerId !== DEFAULT_STUB_LLM_PROVIDER_ID
    ) {
      const stub = this.providers.get(DEFAULT_STUB_LLM_PROVIDER_ID);
      if (stub) {
        return stub.streamResponse(
          { ...request, providerId: stub.providerId },
          normalized,
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

  private resolveRequestProviderId(request: LlmProviderRequest): string {
    const explicit = request.providerId?.trim();
    if (explicit && explicit.length > 0 && explicit !== DEFAULT_STUB_LLM_PROVIDER_ID) {
      return explicit;
    }
    return this.fallbackProviderId;
  }

  private resolveProvider(providerId: string): LlmProvider {
    const provider = this.providers.get(providerId);

    if (provider) {
      return provider;
    }

    if (allowLlmStubFallback()) {
      return new StubLlmProvider();
    }

    const fallback = this.providers.get(this.fallbackProviderId);
    if (fallback) {
      return fallback;
    }

    return this.providers.get(GROQ_PROVIDER_ID) ?? new StubLlmProvider();
  }
}

/** Factory for orchestrator LLM provider runtime (Phase 81, 82). */
export function createLlmProviderRuntimeFromProviders(
  providers: readonly LlmProvider[],
  options: Omit<CreateDefaultLlmProviderRuntimeOptions, "providers"> = {},
): LlmProviderRuntime {
  return new DefaultLlmProviderRuntime({ ...options, providers });
}

/** Factory for orchestrator LLM provider runtime (Phase 81, 82). */
export function createDefaultLlmProviderRuntime(
  options: CreateDefaultLlmProviderRuntimeOptions = {},
): LlmProviderRuntime {
  if (!options.providers) {
    return createDefaultProviderValidationRuntime({
      providerRuntime: options.providerRuntime,
      fallbackProviderId: options.fallbackProviderId ?? resolveDefaultLiveLlmProviderId(),
    }).asLlmProviderRuntime();
  }

  return createLlmProviderRuntimeFromProviders(options.providers, options);
}

import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmProvider, LlmProviderValidation } from "../llm-provider";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";

import type { ProviderConfiguration } from "./provider-configuration";
import {
  buildApiKeyValidation,
  executeOpenAiCompatiblePrompt,
  resolveModelFromRequest,
  streamOpenAiCompatibleResponse,
} from "./openai-compatible-executor";

export function createOpenAiCompatibleProvider(
  configuration: ProviderConfiguration,
  modelEnvVars: readonly string[],
  extraHeaders?: Readonly<Record<string, string>>,
): LlmProvider {
  const executorOptions = {
    configuration,
    resolveModel: (input: LlmProviderRequest) =>
      resolveModelFromRequest(input, configuration, modelEnvVars),
    extraHeaders,
  };

  return {
    providerId: configuration.providerId,
    kind: configuration.kind,
    label: configuration.label,

    async validateProvider(): Promise<LlmProviderValidation> {
      const validation = buildApiKeyValidation(configuration);
      return {
        ...validation,
        providerId: configuration.providerId,
        kind: configuration.kind,
      };
    },

    executePrompt(request: LlmProviderRequest): Promise<LlmProviderResponse> {
      return executeOpenAiCompatiblePrompt(executorOptions, request, request.providerApiKey);
    },

    streamResponse(
      request: LlmProviderRequest,
      subscriber: LlmStreamSubscriber,
    ): Promise<LlmProviderResponse> {
      return streamOpenAiCompatibleResponse(
        executorOptions,
        request,
        subscriber,
        request.providerApiKey,
      );
    },
  };
}

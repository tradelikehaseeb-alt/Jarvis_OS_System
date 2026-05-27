import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import type { LlmProviderKind } from "../llm-provider";
import { createStubLlmResponse } from "../llm-provider-utils";

import type { ProviderConfiguration } from "./provider-configuration";
import { readEnvApiKey } from "./read-env-api-key";

interface OpenAiChatResponse {
  readonly choices?: readonly {
    readonly message?: { readonly content?: string };
  }[];
}

export interface OpenAiCompatibleExecutorOptions {
  readonly configuration: ProviderConfiguration;
  readonly resolveModel: (request: LlmProviderRequest) => string;
  readonly extraHeaders?: Readonly<Record<string, string>>;
}

function buildMessages(request: LlmProviderRequest): readonly {
  role: string;
  content: string;
}[] {
  return [
    ...(request.systemPrompt
      ? [{ role: "system", content: request.systemPrompt }]
      : []),
    { role: "user", content: request.prompt },
  ];
}

export async function executeOpenAiCompatiblePrompt(
  options: OpenAiCompatibleExecutorOptions,
  request: LlmProviderRequest,
  apiKey?: string,
): Promise<LlmProviderResponse> {
  const { configuration } = options;
  const model = options.resolveModel(request);
  const key = apiKey ?? request.providerApiKey ?? readEnvApiKey(configuration.apiKeyEnvVars);

  if (!key && configuration.kind !== "ollama") {
    return createStubLlmResponse(request, configuration.kind, configuration.providerId, {
      model,
    });
  }

  if (!configuration.baseUrl) {
    return createStubLlmResponse(request, configuration.kind, configuration.providerId, {
      model,
      error: { code: "PROVIDER_MISCONFIGURED", message: "Provider base URL missing" },
    });
  }

  try {
    const response = await fetch(`${configuration.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key ?? ""}`,
        "Content-Type": "application/json",
        ...options.extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(request),
      }),
    });

    if (!response.ok) {
      return createStubLlmResponse(request, configuration.kind, configuration.providerId, {
        model,
        error: {
          code: `${configuration.kind.toUpperCase()}_HTTP_ERROR`,
          message: `${configuration.label} request failed (${response.status})`,
        },
      });
    }

    const payload = (await response.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content?.trim() ?? "";

    return {
      success: content.length > 0,
      providerId: configuration.providerId,
      kind: configuration.kind,
      stub: false,
      model,
      content,
      streamed: false,
      error:
        content.length > 0
          ? undefined
          : {
              code: `${configuration.kind.toUpperCase()}_EMPTY`,
              message: `${configuration.label} returned empty content`,
            },
    };
  } catch (error) {
    return createStubLlmResponse(request, configuration.kind, configuration.providerId, {
      model,
      error: {
        code: `${configuration.kind.toUpperCase()}_UNAVAILABLE`,
        message:
          error instanceof Error ? error.message : `${configuration.label} unavailable`,
      },
    });
  }
}

export async function streamOpenAiCompatibleResponse(
  options: OpenAiCompatibleExecutorOptions,
  request: LlmProviderRequest,
  subscriber: LlmStreamSubscriber,
  apiKey?: string,
): Promise<LlmProviderResponse> {
  const result = await executeOpenAiCompatiblePrompt(options, request, apiKey);
  if (result.success && result.content.length > 0) {
    for (const chunk of result.content.split(" ")) {
      subscriber.onChunk(`${chunk} `);
    }
    subscriber.onComplete?.({ content: result.content });
    return { ...result, streamed: true };
  }

  return { ...result, streamed: true };
}

export function resolveModelFromRequest(
  request: LlmProviderRequest,
  configuration: ProviderConfiguration,
  modelEnvVars: readonly string[],
): string {
  if (request.model) {
    return request.model;
  }

  for (const envVar of modelEnvVars) {
    const value = process.env[envVar];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return configuration.defaultModel;
}

export function buildApiKeyValidation(
  configuration: ProviderConfiguration,
  apiKey?: string,
): {
  readonly valid: boolean;
  readonly stub: boolean;
  readonly message: string;
} {
  const resolved = apiKey ?? readEnvApiKey(configuration.apiKeyEnvVars);

  if (configuration.kind === "ollama") {
    return {
      valid: true,
      stub: false,
      message: "Ollama does not require an API key",
    };
  }

  if (!resolved) {
    return {
      valid: false,
      stub: true,
      message: `${configuration.label} API key not configured — stub fallback active`,
    };
  }

  return {
    valid: resolved.length >= 8,
    stub: false,
    message: `${configuration.label} API key configured`,
  };
}

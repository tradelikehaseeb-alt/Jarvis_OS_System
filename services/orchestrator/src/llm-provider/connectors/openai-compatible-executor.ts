import type { LlmProviderRequest } from "../llm-provider-request";
import type { LlmProviderResponse } from "../llm-provider-response";
import type { LlmStreamSubscriber } from "../llm-stream-subscriber";
import type { LlmProviderKind } from "../llm-provider";
import {
  allowLlmStubFallback,
  createFailClosedLlmResponse,
} from "../llm-provider-policy";
import { createStubLlmResponse } from "../llm-provider-utils";

import type { ProviderConfiguration } from "./provider-configuration";
import {
  fetchWithLlmRetries,
  LlmHttpError,
  mapLlmHttpResponseError,
} from "./llm-http-retry";
import { consumeOpenAiSseStream } from "./parse-openai-sse-chunks";
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

function buildSuccessResponse(
  configuration: ProviderConfiguration,
  model: string,
  content: string,
  options: {
    readonly streamed: boolean;
    readonly latencyMs: number;
  },
): LlmProviderResponse {
  return {
    success: content.length > 0,
    providerId: configuration.providerId,
    kind: configuration.kind,
    stub: false,
    model,
    content,
    streamed: options.streamed,
    latencyMs: options.latencyMs,
    error:
      content.length > 0
        ? undefined
        : {
            code: `${configuration.kind.toUpperCase()}_EMPTY`,
            message: `${configuration.label} returned empty content`,
          },
  };
}

function missingKeyResponse(
  configuration: ProviderConfiguration,
  request: LlmProviderRequest,
  model: string,
  streamed: boolean,
): LlmProviderResponse {
  if (allowLlmStubFallback()) {
    return createStubLlmResponse(request, configuration.kind, configuration.providerId, {
      model,
      streamed,
      error: {
        code: "PROVIDER_KEY_MISSING",
        message: `${configuration.label} API key not configured — stub fallback (test mode)`,
      },
    });
  }

  return createFailClosedLlmResponse(
    request,
    configuration.providerId,
    configuration.kind,
    "PROVIDER_KEY_MISSING",
    `${configuration.label} API key not configured. Set ${configuration.apiKeyEnvVars[0] ?? "API_KEY"} in .env`,
    { streamed, model },
  );
}

function mapExecutorError(
  configuration: ProviderConfiguration,
  request: LlmProviderRequest,
  model: string,
  streamed: boolean,
  error: unknown,
): LlmProviderResponse {
  if (error instanceof LlmHttpError) {
    return createFailClosedLlmResponse(
      request,
      configuration.providerId,
      configuration.kind,
      error.code,
      error.message,
      { streamed, model },
    );
  }

  const message =
    error instanceof Error ? error.message : `${configuration.label} unavailable`;

  return createFailClosedLlmResponse(
    request,
    configuration.providerId,
    configuration.kind,
    `${configuration.kind.toUpperCase()}_UNAVAILABLE`,
    message,
    { streamed, model },
  );
}

export async function executeOpenAiCompatiblePrompt(
  options: OpenAiCompatibleExecutorOptions,
  request: LlmProviderRequest,
  apiKey?: string,
): Promise<LlmProviderResponse> {
  const { configuration } = options;
  const model = options.resolveModel(request);
  const key = apiKey ?? request.providerApiKey ?? readEnvApiKey(configuration.apiKeyEnvVars);
  const startedAt = Date.now();

  if (!key && configuration.kind !== "ollama") {
    return missingKeyResponse(configuration, request, model, false);
  }

  if (!configuration.baseUrl) {
    return createFailClosedLlmResponse(
      request,
      configuration.providerId,
      configuration.kind,
      "PROVIDER_MISCONFIGURED",
      "Provider base URL missing",
      { model },
    );
  }

  try {
    const response = await fetchWithLlmRetries(
      `${configuration.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key ?? ""}`,
          "Content-Type": "application/json",
          ...options.extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: buildMessages(request),
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      const httpError = mapLlmHttpResponseError(
        response.status,
        response.statusText,
        configuration.label,
      );
      return mapExecutorError(configuration, request, model, false, httpError);
    }

    const payload = (await response.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content?.trim() ?? "";

    return buildSuccessResponse(configuration, model, content, {
      streamed: false,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return mapExecutorError(configuration, request, model, false, error);
  }
}

export async function streamOpenAiCompatibleResponse(
  options: OpenAiCompatibleExecutorOptions,
  request: LlmProviderRequest,
  subscriber: LlmStreamSubscriber,
  apiKey?: string,
): Promise<LlmProviderResponse> {
  const { configuration } = options;
  const model = options.resolveModel(request);
  const key = apiKey ?? request.providerApiKey ?? readEnvApiKey(configuration.apiKeyEnvVars);
  const startedAt = Date.now();

  if (!key && configuration.kind !== "ollama") {
    const response = missingKeyResponse(configuration, request, model, true);
    if (response.content.length > 0) {
      subscriber.onChunk(response.content);
      subscriber.onComplete?.({ content: response.content });
    }
    return response;
  }

  if (!configuration.baseUrl) {
    return createFailClosedLlmResponse(
      request,
      configuration.providerId,
      configuration.kind,
      "PROVIDER_MISCONFIGURED",
      "Provider base URL missing",
      { streamed: true, model },
    );
  }

  try {
    const response = await fetchWithLlmRetries(
      `${configuration.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key ?? ""}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...options.extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: buildMessages(request),
          stream: true,
        }),
      },
    );

    if (!response.ok || !response.body) {
      const httpError = mapLlmHttpResponseError(
        response.status,
        response.statusText,
        configuration.label,
      );
      return mapExecutorError(configuration, request, model, true, httpError);
    }

    const content = await consumeOpenAiSseStream(response.body, (chunk) => {
      subscriber.onChunk(chunk);
    });
    subscriber.onComplete?.({ content });

    return buildSuccessResponse(configuration, model, content, {
      streamed: true,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return mapExecutorError(configuration, request, model, true, error);
  }
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
    if (allowLlmStubFallback()) {
      return {
        valid: false,
        stub: true,
        message: `${configuration.label} API key not configured — stub fallback (test mode)`,
      };
    }

    return {
      valid: false,
      stub: false,
      message: `${configuration.label} API key not configured. Set ${configuration.apiKeyEnvVars[0] ?? "API_KEY"} in .env`,
    };
  }

  return {
    valid: resolved.length >= 8,
    stub: false,
    message: `${configuration.label} API key configured`,
  };
}

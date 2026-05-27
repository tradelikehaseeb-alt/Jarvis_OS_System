import type { LlmProviderRequest } from "./llm-provider-request";
import type { LlmProviderResponse } from "./llm-provider-response";
import {
  DEFAULT_STUB_LLM_PROVIDER_ID,
  type LlmProviderKind,
} from "./llm-provider";

/** Build deterministic stub LLM content for fallback paths (Phase 81). */
export function buildStubLlmContent(
  request: LlmProviderRequest,
  kind: LlmProviderKind,
): string {
  const prompt = request.prompt.trim() || "empty prompt";
  return `[${kind}-stub] Planning context for: ${prompt}`;
}

/** Create a stub LLM response (Phase 81). */
export function createStubLlmResponse(
  request: LlmProviderRequest,
  kind: LlmProviderKind,
  providerId: string,
  options: {
    readonly streamed?: boolean;
    readonly model?: string;
    readonly error?: LlmProviderResponse["error"];
  } = {},
): LlmProviderResponse {
  return {
    success: options.error ? false : true,
    providerId,
    kind,
    stub: true,
    model: options.model ?? `${kind}-stub-model`,
    content: options.error ? "" : buildStubLlmContent(request, kind),
    streamed: options.streamed ?? false,
    error: options.error,
  };
}

export function resolveOpenAiModel(request: LlmProviderRequest): string {
  return (
    request.model ??
    process.env.OPENAI_MODEL ??
    process.env.JARVIS_OPENAI_MODEL ??
    "gpt-4o-mini"
  );
}

export function resolveOllamaModel(request: LlmProviderRequest): string {
  return (
    request.model ??
    process.env.OLLAMA_MODEL ??
    process.env.JARVIS_OLLAMA_MODEL ??
    "llama3.2"
  );
}

export function resolveOllamaBaseUrl(): string {
  return (
    process.env.OLLAMA_BASE_URL ??
    process.env.JARVIS_OLLAMA_BASE_URL ??
    "http://localhost:11434"
  ).replace(/\/$/, "");
}

export function readOpenAiApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY ?? process.env.JARVIS_OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
}

export function resolveDefaultLlmProviderId(
  metadata?: Readonly<Record<string, unknown>>,
): string {
  const fromMetadata = metadata?.llmProviderId;
  if (typeof fromMetadata === "string" && fromMetadata.trim().length > 0) {
    return fromMetadata.trim();
  }

  const fromEnv = process.env.JARVIS_LLM_PROVIDER ?? process.env.LLM_PROVIDER;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  if (readOpenAiApiKey()) {
    return "openai";
  }

  return DEFAULT_STUB_LLM_PROVIDER_ID;
}

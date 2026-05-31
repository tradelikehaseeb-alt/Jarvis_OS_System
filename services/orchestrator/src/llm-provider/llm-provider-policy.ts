import {
  GEMINI_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_CONFIGURATION,
  OPENAI_PROVIDER_CONFIGURATION,
} from "./connectors/default-provider-configurations";
import type { ProviderConfiguration } from "./connectors/provider-configuration";
import { readEnvApiKey } from "./connectors/read-env-api-key";
import { GROQ_PROVIDER_ID } from "./connectors/default-provider-configurations";
import { DEFAULT_STUB_LLM_PROVIDER_ID } from "./llm-provider";
import type { LlmProviderRequest } from "./llm-provider-request";
import type { LlmProviderResponse } from "./llm-provider-response";
import type { LlmProviderKind } from "./llm-provider";

export const NO_LLM_API_KEYS_MESSAGE =
  "No LLM API key configured. Set GROQ_API_KEY in .env";

/** Primary live provider chain (Groq → OpenAI → Gemini). */
export const PRIMARY_LLM_PROVIDER_CHAIN: readonly ProviderConfiguration[] = [
  GROQ_PROVIDER_CONFIGURATION,
  OPENAI_PROVIDER_CONFIGURATION,
  GEMINI_PROVIDER_CONFIGURATION,
];

/**
 * Stub LLM is allowed only in tests or when explicitly opted in.
 *
 * Production default: `JARVIS_ALLOW_LLM_STUB_FALLBACK` unset or `false` → fail-closed.
 */
export function allowLlmStubFallback(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (env.NODE_ENV === "test") {
    return true;
  }
  return env.JARVIS_ALLOW_LLM_STUB_FALLBACK === "true";
}

/** First configured provider in the primary chain, if any. */
export function resolvePrimaryLlmProviderId(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  for (const configuration of PRIMARY_LLM_PROVIDER_CHAIN) {
    if (readEnvApiKey(configuration.apiKeyEnvVars, env)) {
      return configuration.providerId;
    }
  }
  return undefined;
}

/** Default live provider id — Groq when `GROQ_API_KEY` is set, else chain fallbacks. */
export function resolveDefaultLiveLlmProviderId(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const configured = resolvePrimaryLlmProviderId(env);
  if (configured) {
    return configured;
  }

  if (allowLlmStubFallback(env)) {
    return DEFAULT_STUB_LLM_PROVIDER_ID;
  }

  return GROQ_PROVIDER_ID;
}

export function hasAnyPrimaryLlmApiKey(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return resolvePrimaryLlmProviderId(env) !== undefined;
}

export function createFailClosedLlmResponse(
  request: LlmProviderRequest,
  providerId: string,
  kind: LlmProviderKind,
  code: string,
  message: string,
  options: { readonly streamed?: boolean; readonly model?: string } = {},
): LlmProviderResponse {
  return {
    success: false,
    providerId,
    kind,
    stub: false,
    model: options.model ?? `${kind}-model`,
    content: "",
    streamed: options.streamed ?? false,
    error: { code, message },
  };
}

export function createNoLlmApiKeysResponse(
  request: LlmProviderRequest,
  providerId: string = GROQ_PROVIDER_ID,
): LlmProviderResponse {
  return createFailClosedLlmResponse(
    request,
    providerId,
    "groq",
    "LLM_API_KEY_MISSING",
    NO_LLM_API_KEYS_MESSAGE,
    { model: GROQ_PROVIDER_CONFIGURATION.defaultModel },
  );
}

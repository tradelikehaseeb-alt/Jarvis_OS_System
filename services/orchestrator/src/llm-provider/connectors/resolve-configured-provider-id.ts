import {
  DEEPSEEK_PROVIDER_CONFIGURATION,
  GEMINI_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_ID,
  MINIMAX_PROVIDER_CONFIGURATION,
  OPENAI_PROVIDER_CONFIGURATION,
  OPENROUTER_PROVIDER_CONFIGURATION,
  OLLAMA_PROVIDER_ID,
} from "./default-provider-configurations";
import type { ProviderConfiguration } from "./provider-configuration";
import { PRIMARY_LLM_PROVIDER_CHAIN } from "../llm-provider-policy";
import { readEnvApiKey } from "./read-env-api-key";

/** Extended auto-detect order when primary chain has no keys (Phase 89). */
export const EXTENDED_PROVIDER_RESOLUTION_ORDER: readonly ProviderConfiguration[] = [
  OPENROUTER_PROVIDER_CONFIGURATION,
  DEEPSEEK_PROVIDER_CONFIGURATION,
  MINIMAX_PROVIDER_CONFIGURATION,
];

/**
 * Returns the first provider with a configured API key in the primary chain
 * (Groq → OpenAI → Gemini), then extended providers.
 */
export function resolveFirstConfiguredProviderId(): string | undefined {
  for (const configuration of PRIMARY_LLM_PROVIDER_CHAIN) {
    if (readEnvApiKey(configuration.apiKeyEnvVars)) {
      return configuration.providerId;
    }
  }

  for (const configuration of EXTENDED_PROVIDER_RESOLUTION_ORDER) {
    if (readEnvApiKey(configuration.apiKeyEnvVars)) {
      return configuration.providerId;
    }
  }

  return undefined;
}

/** Default live provider — prefers Groq when `GROQ_API_KEY` is set. */
export function resolvePreferredLiveProviderId(): string {
  return resolveFirstConfiguredProviderId() ?? GROQ_PROVIDER_ID;
}

/** @deprecated Use {@link PRIMARY_LLM_PROVIDER_CHAIN} */
export const LIVE_PROVIDER_RESOLUTION_ORDER = [
  ...PRIMARY_LLM_PROVIDER_CHAIN,
  ...EXTENDED_PROVIDER_RESOLUTION_ORDER,
] as const;

export { OLLAMA_PROVIDER_ID, GROQ_PROVIDER_ID };

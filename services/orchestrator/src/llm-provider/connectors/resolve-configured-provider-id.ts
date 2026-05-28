import {
  DEEPSEEK_PROVIDER_CONFIGURATION,
  GEMINI_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_CONFIGURATION,
  MINIMAX_PROVIDER_CONFIGURATION,
  OPENAI_PROVIDER_CONFIGURATION,
  OPENROUTER_PROVIDER_CONFIGURATION,
  OLLAMA_PROVIDER_ID,
} from "./default-provider-configurations";
import type { ProviderConfiguration } from "./provider-configuration";
import { readEnvApiKey } from "./read-env-api-key";

/** Priority order for auto-detecting a configured live provider (Phase 89). */
export const LIVE_PROVIDER_RESOLUTION_ORDER: readonly ProviderConfiguration[] = [
  OPENROUTER_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_CONFIGURATION,
  GEMINI_PROVIDER_CONFIGURATION,
  OPENAI_PROVIDER_CONFIGURATION,
  DEEPSEEK_PROVIDER_CONFIGURATION,
  MINIMAX_PROVIDER_CONFIGURATION,
];

/**
 * Returns the first provider with a configured API key, or undefined.
 * Ollama is excluded — it requires a runtime health probe.
 */
export function resolveFirstConfiguredProviderId(): string | undefined {
  for (const configuration of LIVE_PROVIDER_RESOLUTION_ORDER) {
    if (readEnvApiKey(configuration.apiKeyEnvVars)) {
      return configuration.providerId;
    }
  }

  return undefined;
}

export { OLLAMA_PROVIDER_ID };

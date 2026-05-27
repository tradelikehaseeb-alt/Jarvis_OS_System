import type { LlmProvider } from "../llm-provider";
import { DEFAULT_STUB_LLM_PROVIDER_ID } from "../llm-provider";
import { StubLlmProvider } from "../providers/stub-llm-provider";

import { createDeepSeekProvider } from "./deepseek-provider";
import {
  DEEPSEEK_PROVIDER_CONFIGURATION,
  GEMINI_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_CONFIGURATION,
  MINIMAX_PROVIDER_CONFIGURATION,
  OLLAMA_PROVIDER_CONFIGURATION,
  OPENAI_PROVIDER_CONFIGURATION,
  OPENROUTER_PROVIDER_CONFIGURATION,
} from "./default-provider-configurations";
import { createGeminiProvider } from "./gemini-provider";
import { createGroqProvider } from "./groq-provider";
import { createMinimaxProvider } from "./minimax-provider";
import { createOllamaProvider } from "./ollama-provider";
import { createOpenAIProvider } from "./openai-provider";
import { createOpenRouterProvider } from "./openrouter-provider";
import type { ProviderConfiguration } from "./provider-configuration";
import {
  InMemoryProviderRegistry,
  type ProviderRegistry,
} from "./provider-registry";

const STUB_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: DEFAULT_STUB_LLM_PROVIDER_ID,
  kind: "stub",
  label: "LLM Stub",
  apiKeyEnvVars: [],
  defaultModel: "stub-model",
  availableModels: ["stub-model"],
  stub: true,
};

/** Register default multi-provider connectors (Phase 82). */
export function registerDefaultLlmProviders(
  registry: ProviderRegistry = new InMemoryProviderRegistry(),
): ProviderRegistry {
  registry.registerProvider(new StubLlmProvider(), STUB_PROVIDER_CONFIGURATION);

  const pairs: Array<[LlmProvider, ProviderConfiguration]> = [
    [createOpenAIProvider().inner, OPENAI_PROVIDER_CONFIGURATION],
    [createGeminiProvider().inner, GEMINI_PROVIDER_CONFIGURATION],
    [createGroqProvider().inner, GROQ_PROVIDER_CONFIGURATION],
    [createOpenRouterProvider().inner, OPENROUTER_PROVIDER_CONFIGURATION],
    [createOllamaProvider(), OLLAMA_PROVIDER_CONFIGURATION],
    [createDeepSeekProvider().inner, DEEPSEEK_PROVIDER_CONFIGURATION],
    [createMinimaxProvider().inner, MINIMAX_PROVIDER_CONFIGURATION],
  ];

  for (const [provider, configuration] of pairs) {
    registry.registerProvider(provider, configuration);
  }

  return registry;
}

export function createDefaultProviderRegistry(): ProviderRegistry {
  return registerDefaultLlmProviders();
}

export { STUB_PROVIDER_CONFIGURATION };

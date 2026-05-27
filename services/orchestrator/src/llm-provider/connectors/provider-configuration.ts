import type { LlmProviderKind } from "../llm-provider";

/**
 * Static configuration for a registered LLM connector (Phase 82).
 */
export interface ProviderConfiguration {
  readonly providerId: string;
  readonly kind: LlmProviderKind;
  readonly label: string;
  readonly apiKeyEnvVars: readonly string[];
  readonly baseUrl?: string;
  readonly defaultModel: string;
  readonly availableModels: readonly string[];
  readonly stub: boolean;
}

export interface ProviderRegistryEntry {
  readonly configuration: ProviderConfiguration;
}

import type { ProviderConfiguration } from "./provider-configuration";

export const OPENAI_PROVIDER_ID = "openai" as const;
export const GEMINI_PROVIDER_ID = "gemini" as const;
export const GROQ_PROVIDER_ID = "groq" as const;
export const OPENROUTER_PROVIDER_ID = "openrouter" as const;
export const OLLAMA_PROVIDER_ID = "ollama" as const;
export const DEEPSEEK_PROVIDER_ID = "deepseek" as const;
export const MINIMAX_PROVIDER_ID = "minimax" as const;

export const OPENAI_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: OPENAI_PROVIDER_ID,
  kind: "openai",
  label: "OpenAI",
  apiKeyEnvVars: ["OPENAI_API_KEY", "JARVIS_OPENAI_API_KEY"],
  baseUrl: "https://api.openai.com/v1",
  defaultModel: "gpt-4o-mini",
  availableModels: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  stub: false,
};

export const GEMINI_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: GEMINI_PROVIDER_ID,
  kind: "gemini",
  label: "Gemini",
  apiKeyEnvVars: ["GEMINI_API_KEY", "JARVIS_GEMINI_API_KEY", "GOOGLE_API_KEY"],
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  defaultModel: "gemini-2.0-flash",
  availableModels: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  stub: false,
};

export const GROQ_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: GROQ_PROVIDER_ID,
  kind: "groq",
  label: "Groq",
  apiKeyEnvVars: ["GROQ_API_KEY", "JARVIS_GROQ_API_KEY"],
  baseUrl: "https://api.groq.com/openai/v1",
  defaultModel: "llama-3.3-70b-versatile",
  availableModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  stub: false,
};

export const OPENROUTER_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: OPENROUTER_PROVIDER_ID,
  kind: "openrouter",
  label: "OpenRouter",
  apiKeyEnvVars: ["OPENROUTER_API_KEY", "JARVIS_OPENROUTER_API_KEY"],
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "openai/gpt-4o-mini",
  availableModels: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet"],
  stub: false,
};

export const OLLAMA_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: OLLAMA_PROVIDER_ID,
  kind: "ollama",
  label: "Ollama (local)",
  apiKeyEnvVars: [],
  baseUrl: undefined,
  defaultModel: "llama3.2",
  availableModels: ["llama3.2", "mistral", "qwen2.5"],
  stub: false,
};

export const DEEPSEEK_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: DEEPSEEK_PROVIDER_ID,
  kind: "deepseek",
  label: "DeepSeek",
  apiKeyEnvVars: ["DEEPSEEK_API_KEY", "JARVIS_DEEPSEEK_API_KEY"],
  baseUrl: "https://api.deepseek.com/v1",
  defaultModel: "deepseek-chat",
  availableModels: ["deepseek-chat", "deepseek-reasoner"],
  stub: false,
};

export const MINIMAX_PROVIDER_CONFIGURATION: ProviderConfiguration = {
  providerId: MINIMAX_PROVIDER_ID,
  kind: "minimax",
  label: "Minimax",
  apiKeyEnvVars: ["MINIMAX_API_KEY", "JARVIS_MINIMAX_API_KEY"],
  baseUrl: "https://api.minimax.io/v1",
  defaultModel: "abab6.5s-chat",
  availableModels: ["abab6.5s-chat", "abab6.5g-chat"],
  stub: false,
};

export const DEFAULT_CONNECTOR_CONFIGURATIONS: readonly ProviderConfiguration[] = [
  OPENAI_PROVIDER_CONFIGURATION,
  GEMINI_PROVIDER_CONFIGURATION,
  GROQ_PROVIDER_CONFIGURATION,
  OPENROUTER_PROVIDER_CONFIGURATION,
  OLLAMA_PROVIDER_CONFIGURATION,
  DEEPSEEK_PROVIDER_CONFIGURATION,
  MINIMAX_PROVIDER_CONFIGURATION,
];

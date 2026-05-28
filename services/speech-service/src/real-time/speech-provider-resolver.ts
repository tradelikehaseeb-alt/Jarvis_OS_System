import type { SpeechProviderConfig } from "../adapters/speech-provider-config";

export interface SpeechProviderDefinition {
  readonly providerId: string;
  readonly apiKeyEnvVars: readonly string[];
  readonly baseUrl?: string;
  readonly model?: string;
}

export const STT_PROVIDER_DEFINITIONS: readonly SpeechProviderDefinition[] = [
  {
    providerId: "whisper",
    apiKeyEnvVars: ["OPENAI_API_KEY", "JARVIS_OPENAI_API_KEY"],
    baseUrl: "https://api.openai.com/v1",
    model: "whisper-1",
  },
  {
    providerId: "deepgram",
    apiKeyEnvVars: ["DEEPGRAM_API_KEY", "JARVIS_DEEPGRAM_API_KEY"],
    baseUrl: "https://api.deepgram.com/v1",
    model: "nova-2",
  },
  {
    providerId: "groq-whisper",
    apiKeyEnvVars: ["GROQ_API_KEY", "JARVIS_GROQ_API_KEY"],
    baseUrl: "https://api.groq.com/openai/v1",
    model: "whisper-large-v3",
  },
  {
    providerId: "openai-realtime",
    apiKeyEnvVars: ["OPENAI_API_KEY", "JARVIS_OPENAI_API_KEY"],
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-realtime-preview",
  },
];

export const TTS_PROVIDER_DEFINITIONS: readonly SpeechProviderDefinition[] = [
  {
    providerId: "elevenlabs",
    apiKeyEnvVars: ["ELEVENLABS_API_KEY", "JARVIS_ELEVENLABS_API_KEY"],
    baseUrl: "https://api.elevenlabs.io/v1",
    model: "eleven_multilingual_v2",
  },
  {
    providerId: "openai-tts",
    apiKeyEnvVars: ["OPENAI_API_KEY", "JARVIS_OPENAI_API_KEY"],
    baseUrl: "https://api.openai.com/v1",
    model: "tts-1",
  },
  {
    providerId: "edge-tts",
    apiKeyEnvVars: [],
    baseUrl: "https://speech.platform.bing.com",
    model: "en-US-JennyNeural",
  },
];

export function readEnvApiKey(envVars: readonly string[]): string | undefined {
  for (const key of envVars) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function resolveSpeechProviderConfig(
  definition: SpeechProviderDefinition,
  explicitApiKey?: string,
): SpeechProviderConfig {
  const apiKey = explicitApiKey ?? readEnvApiKey(definition.apiKeyEnvVars);
  const live = Boolean(apiKey) || definition.providerId === "edge-tts";
  return {
    providerId: definition.providerId,
    mode: live ? "live" : "stub",
    apiKey,
    baseUrl: definition.baseUrl,
    model: definition.model,
  };
}

export function resolveFirstConfiguredSttProvider(
  priority: readonly string[] = ["whisper", "deepgram", "groq-whisper", "openai-realtime"],
): SpeechProviderConfig {
  for (const providerId of priority) {
    const definition = STT_PROVIDER_DEFINITIONS.find((d) => d.providerId === providerId);
    if (!definition) {
      continue;
    }
    const config = resolveSpeechProviderConfig(definition);
    if (config.mode === "live") {
      return config;
    }
  }
  return {
    providerId: "speech-stub",
    mode: "stub",
  };
}

export function resolveFirstConfiguredTtsProvider(
  priority: readonly string[] = ["openai-tts", "elevenlabs", "edge-tts"],
): SpeechProviderConfig {
  for (const providerId of priority) {
    const definition = TTS_PROVIDER_DEFINITIONS.find((d) => d.providerId === providerId);
    if (!definition) {
      continue;
    }
    const config = resolveSpeechProviderConfig(definition);
    if (config.mode === "live") {
      return config;
    }
  }
  return {
    providerId: "speech-stub",
    mode: "stub",
  };
}

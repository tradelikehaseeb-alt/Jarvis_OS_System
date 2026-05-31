import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { SpeechRequest } from "../adapters/speech-request";
import type { SpeechResponse } from "../adapters/speech-response";
import {
  EdgeTtsAdapter,
  ElevenLabsTtsAdapter,
  OpenAiTtsAdapter,
} from "../adapters/live-tts-adapters";
import { StubTextToSpeechAdapter } from "../adapters/stub-text-to-speech-adapter";

import {
  resolveFirstConfiguredTtsProvider,
  resolveSpeechProviderConfig,
  TTS_PROVIDER_DEFINITIONS,
} from "./speech-provider-resolver";

export interface TtsProviderRuntimeOptions {
  readonly adapter?: TextToSpeechAdapter;
  readonly config?: SpeechProviderConfig;
  readonly fallbackChain?: readonly SpeechProviderConfig[];
}

const TTS_BY_PROVIDER: Record<string, TextToSpeechAdapter> = {
  elevenlabs: ElevenLabsTtsAdapter,
  "openai-tts": OpenAiTtsAdapter,
  "edge-tts": EdgeTtsAdapter,
  "speech-stub": new StubTextToSpeechAdapter(),
};

function buildLiveTtsChain(
  explicit?: readonly SpeechProviderConfig[],
): readonly SpeechProviderConfig[] {
  if (explicit && explicit.length > 0) {
    return explicit.filter((config) => config.mode === "live");
  }

  const priority = ["edge-tts", "openai-tts", "elevenlabs"] as const;
  const chain: SpeechProviderConfig[] = [];
  for (const providerId of priority) {
    const definition = TTS_PROVIDER_DEFINITIONS.find(
      (entry) => entry.providerId === providerId,
    );
    if (!definition) {
      continue;
    }
    const config = resolveSpeechProviderConfig(definition);
    if (config.mode === "live") {
      chain.push(config);
    }
  }
  return chain;
}

/**
 * TTS provider runtime with ordered live fallback (no silent stub fallback).
 */
export class TtsProviderRuntime {
  private readonly adapters: Map<string, TextToSpeechAdapter>;
  private readonly fallbackChain: readonly SpeechProviderConfig[];

  constructor(options: TtsProviderRuntimeOptions = {}) {
    this.adapters = new Map(Object.entries(TTS_BY_PROVIDER));
    if (options.adapter) {
      this.adapters.set(
        options.config?.providerId ?? options.adapter.adapterId,
        options.adapter,
      );
    }
    this.fallbackChain = buildLiveTtsChain(
      options.fallbackChain ??
        (options.config ? [options.config] : undefined),
    );
  }

  async synthesize(request: SpeechRequest): Promise<SpeechResponse> {
    if (this.fallbackChain.length === 0) {
      return {
        requestId: request.requestId,
        adapterId: "tts-runtime",
        providerId: "speech-stub",
        stub: false,
        output: request.text,
        createdAt: new Date().toISOString(),
        error: {
          code: "TTS_KEY_MISSING",
          message: "No live TTS provider is configured",
        },
      };
    }

    let lastResponse: SpeechResponse | undefined;
    for (const config of this.fallbackChain) {
      const adapter =
        this.adapters.get(config.providerId) ?? new StubTextToSpeechAdapter();
      const response = await adapter.synthesize(request, config);
      if (!response.error && response.audioBase64 && response.audioBase64.length > 0) {
        return response;
      }
      lastResponse = response;
    }

    return (
      lastResponse ?? {
        requestId: request.requestId,
        adapterId: "tts-runtime",
        providerId: "speech-stub",
        stub: false,
        output: request.text,
        createdAt: new Date().toISOString(),
        error: {
          code: "TTS_PROVIDER_ERROR",
          message: "All configured TTS providers failed",
        },
      }
    );
  }
}

export function createDefaultTtsProviderRuntime(
  options?: TtsProviderRuntimeOptions,
): TtsProviderRuntime {
  return new TtsProviderRuntime({
    ...options,
    config: options?.config ?? resolveFirstConfiguredTtsProvider(),
    fallbackChain: options?.fallbackChain ?? buildLiveTtsChain(),
  });
}

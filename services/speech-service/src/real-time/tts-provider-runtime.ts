import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { SpeechRequest } from "../adapters/speech-request";
import type { SpeechResponse } from "../adapters/speech-response";

import { isBrowserLikeEnvironment } from "./resolve-streaming-stt-adapter";
import { resolveTtsAdapter } from "./resolve-tts-provider-runtime";
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

function buildLiveTtsChain(
  explicit?: readonly SpeechProviderConfig[],
): readonly SpeechProviderConfig[] {
  if (explicit && explicit.length > 0) {
    return explicit.filter((config) => config.mode === "live");
  }

  const priority = ["jarvis-tts", "edge-tts", "openai-tts", "elevenlabs"] as const;
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
    const config = options.config ?? resolveFirstConfiguredTtsProvider();
    const adapter = resolveTtsAdapter(config, options.adapter);
    this.adapters = new Map([[config.providerId, adapter]]);
    this.fallbackChain = isBrowserLikeEnvironment()
      ? []
      : buildLiveTtsChain(
          options.fallbackChain ??
            (options.config ? [options.config] : undefined),
        );
  }

  async synthesize(request: SpeechRequest): Promise<SpeechResponse> {
    if (this.fallbackChain.length === 0) {
      const primary = this.adapters.values().next().value;
      if (primary) {
        const config = resolveFirstConfiguredTtsProvider();
        return primary.synthesize(request, config);
      }
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
        this.adapters.get(config.providerId) ??
        resolveTtsAdapter(config);
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

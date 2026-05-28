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

import { resolveFirstConfiguredTtsProvider } from "./speech-provider-resolver";

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

/**
 * TTS provider runtime with ordered fallback (Phase 91).
 */
export class TtsProviderRuntime {
  private readonly adapters: Map<string, TextToSpeechAdapter>;
  private readonly fallbackChain: readonly SpeechProviderConfig[];

  constructor(options: TtsProviderRuntimeOptions = {}) {
    this.adapters = new Map(Object.entries(TTS_BY_PROVIDER));
    if (options.adapter) {
      this.adapters.set(options.config?.providerId ?? options.adapter.adapterId, options.adapter);
    }
    this.fallbackChain = options.fallbackChain ?? [
      options.config ?? resolveFirstConfiguredTtsProvider(),
      { providerId: "speech-stub", mode: "stub" },
    ];
  }

  async synthesize(request: SpeechRequest): Promise<SpeechResponse> {
    let lastError: Error | undefined;
    for (const config of this.fallbackChain) {
      const adapter =
        this.adapters.get(config.providerId) ?? new StubTextToSpeechAdapter();
      try {
        const response = await adapter.synthesize(request, config);
        if (response.output.trim().length > 0) {
          return response;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("TTS failed");
      }
    }
    throw lastError ?? new Error("No TTS provider available");
  }
}

export function createDefaultTtsProviderRuntime(
  options?: TtsProviderRuntimeOptions,
): TtsProviderRuntime {
  return new TtsProviderRuntime(options);
}

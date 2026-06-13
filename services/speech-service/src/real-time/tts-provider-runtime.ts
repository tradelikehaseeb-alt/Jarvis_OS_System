import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";
import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "../adapters/speech-provider-config";
import type { SpeechRequest } from "../adapters/speech-request";
import type { SpeechResponse } from "../adapters/speech-response";
import { StubTextToSpeechAdapterLegacy } from "../adapters/stub-text-to-speech-adapter-legacy";

import {
  DesktopIpcTextToSpeechAdapter,
  hasDesktopSpeechBridge,
} from "./desktop-ipc-speech-adapters";
import {
  isBrowserLikeEnvironment,
  isJarvisRendererBuild,
} from "./environment";
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

function resolveNodeTts(
  config: SpeechProviderConfig,
  explicit?: TextToSpeechAdapter,
): TextToSpeechAdapter {
  const { resolveTtsAdapter } =
    require("./resolve-tts-provider-runtime") as typeof import("./resolve-tts-provider-runtime");
  return resolveTtsAdapter(config, explicit);
}

function resolveDefaultTtsConfig(): SpeechProviderConfig {
  return resolveFirstConfiguredTtsProvider();
}

/**
 * TTS provider runtime with ordered live fallback (no silent stub fallback).
 */
export class TtsProviderRuntime {
  private readonly adapters: Map<string, TextToSpeechAdapter>;
  private readonly fallbackChain: readonly SpeechProviderConfig[];
  private readonly primaryConfig: SpeechProviderConfig;

  constructor(options: TtsProviderRuntimeOptions = {}) {
    if (options.adapter) {
      this.primaryConfig = options.config ?? DEFAULT_STUB_SPEECH_PROVIDER_CONFIG;
      this.adapters = new Map([[this.primaryConfig.providerId, options.adapter]]);
      this.fallbackChain = [];
      return;
    }

    if (isJarvisRendererBuild() || isBrowserLikeEnvironment()) {
      const ipcAdapter = hasDesktopSpeechBridge()
        ? new DesktopIpcTextToSpeechAdapter()
        : new StubTextToSpeechAdapterLegacy();
      this.primaryConfig = {
        providerId: hasDesktopSpeechBridge() ? "edge-tts" : "speech-stub",
        mode: hasDesktopSpeechBridge() ? "live" : "stub",
      };
      this.adapters = new Map([[this.primaryConfig.providerId, ipcAdapter]]);
      this.fallbackChain = [];
      return;
    }

    const config = options.config ?? resolveDefaultTtsConfig();
    const adapter = resolveNodeTts(config, options.adapter);
    this.primaryConfig = config;
    this.adapters = new Map([[config.providerId, adapter]]);
    this.fallbackChain = buildLiveTtsChain(
      options.fallbackChain ??
        (options.config ? [options.config] : undefined),
    );
  }

  async synthesize(request: SpeechRequest): Promise<SpeechResponse> {
    if (this.fallbackChain.length === 0) {
      const primary = this.adapters.values().next().value;
      if (primary) {
        return primary.synthesize(request, this.primaryConfig);
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
        this.adapters.get(config.providerId) ?? resolveNodeTts(config);
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
  if (isJarvisRendererBuild() || isBrowserLikeEnvironment()) {
    const ipcAdapter = hasDesktopSpeechBridge()
      ? new DesktopIpcTextToSpeechAdapter()
      : (options?.adapter ?? new StubTextToSpeechAdapterLegacy());
    return new TtsProviderRuntime({
      ...options,
      adapter: ipcAdapter,
    });
  }

  return new TtsProviderRuntime({
    ...options,
    config: options?.config ?? resolveDefaultTtsConfig(),
    fallbackChain: options?.fallbackChain ?? buildLiveTtsChain(),
  });
}

import { StubSpeechToTextAdapterLegacy } from "../adapters/stub-speech-to-text-adapter-legacy";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { SpeechToTextAdapter } from "../adapters/speech-to-text-adapter";
import { resolveNodeStreamingSttAdapter } from "./resolve-node-streaming-stt-adapter";
/** True when bundled for Electron renderer or other browser contexts. */
export function isBrowserLikeEnvironment(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== "undefined";
}

/**
 * Resolves STT for streaming without eager Node-only adapter imports.
 * Production adapters are passed explicitly via {@link StreamingSpeechRuntimeOptions.sttAdapter}.
 */
export function resolveStreamingSttAdapter(
  config: SpeechProviderConfig,
  explicit?: SpeechToTextAdapter,
): SpeechToTextAdapter {
  if (explicit) {
    return explicit;
  }
  if (isBrowserLikeEnvironment() || config.mode !== "live") {
    return new StubSpeechToTextAdapterLegacy();
  }
  return resolveNodeStreamingSttAdapter(config);
}

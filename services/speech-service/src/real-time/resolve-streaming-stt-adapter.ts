import { StubSpeechToTextAdapterLegacy } from "../adapters/stub-speech-to-text-adapter-legacy";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { SpeechToTextAdapter } from "../adapters/speech-to-text-adapter";
/** True when bundled for Electron renderer or other browser contexts. */
export function isBrowserLikeEnvironment(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== "undefined";
}

/**
 * Resolves STT for streaming without eager Node-only adapter imports.
 * Production adapters are passed explicitly via {@link StreamingSpeechRuntimeOptions.sttAdapter}.
 */
export function resolveStreamingSttAdapter(
  _config: SpeechProviderConfig,
  explicit?: SpeechToTextAdapter,
): SpeechToTextAdapter {
  if (explicit) {
    return explicit;
  }
  return new StubSpeechToTextAdapterLegacy();
}

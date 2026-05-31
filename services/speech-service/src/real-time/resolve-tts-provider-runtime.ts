import { StubTextToSpeechAdapterLegacy } from "../adapters/stub-text-to-speech-adapter-legacy";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";
import { resolveNodeTtsAdapter } from "./resolve-node-tts-adapter";

export function resolveTtsAdapter(
  config: SpeechProviderConfig,
  explicit?: TextToSpeechAdapter,
): TextToSpeechAdapter {
  if (explicit) {
    return explicit;
  }
  if (config.mode !== "live") {
    return new StubTextToSpeechAdapterLegacy();
  }
  return resolveNodeTtsAdapter(config);
}

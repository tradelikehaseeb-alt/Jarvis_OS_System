import { StubTextToSpeechAdapterLegacy } from "../adapters/stub-text-to-speech-adapter-legacy";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";
export function resolveTtsAdapter(
  _config: SpeechProviderConfig,
  explicit?: TextToSpeechAdapter,
): TextToSpeechAdapter {
  if (explicit) {
    return explicit;
  }
  return new StubTextToSpeechAdapterLegacy();
}

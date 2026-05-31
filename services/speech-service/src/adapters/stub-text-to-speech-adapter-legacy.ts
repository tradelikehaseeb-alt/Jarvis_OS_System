import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { TextToSpeechAdapter } from "./text-to-speech-adapter";

/**
 * Deterministic TTS stub (test harness only).
 */
export class StubTextToSpeechAdapterLegacy implements TextToSpeechAdapter {
  readonly adapterId = "stub-text-to-speech-adapter";

  async synthesize(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const normalizedInput = request.text.trim();
    const output =
      normalizedInput.length > 0
        ? `stub-tts:${normalizedInput}`
        : "stub-tts:silence";

    return {
      requestId: request.requestId,
      adapterId: this.adapterId,
      providerId: config.providerId,
      stub: true,
      output,
      createdAt: new Date(0).toISOString(),
    };
  }
}

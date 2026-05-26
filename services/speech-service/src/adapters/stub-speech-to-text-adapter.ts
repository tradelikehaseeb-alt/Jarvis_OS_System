import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { SpeechToTextAdapter } from "./speech-to-text-adapter";

/**
 * Deterministic STT stub adapter (Phase 28).
 *
 * No audio pipeline, no microphone permissions, no external APIs.
 */
export class StubSpeechToTextAdapter implements SpeechToTextAdapter {
  readonly adapterId = "stub-speech-to-text-adapter";

  async transcribe(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const normalizedInput = request.text.trim();
    const output =
      normalizedInput.length > 0 ? normalizedInput : "stub transcript";

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

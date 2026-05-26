import type { SpeechProviderConfig } from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";

/**
 * Text-to-speech adapter contract for future providers (Phase 28).
 */
export interface TextToSpeechAdapter {
  readonly adapterId: string;
  synthesize(
    request: SpeechRequest,
    config?: SpeechProviderConfig,
  ): Promise<SpeechResponse>;
}

import type { SpeechProviderConfig } from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";

/**
 * Speech-to-text adapter contract for future providers (Phase 28).
 */
export interface SpeechToTextAdapter {
  readonly adapterId: string;
  transcribe(
    request: SpeechRequest,
    config?: SpeechProviderConfig,
  ): Promise<SpeechResponse>;
}

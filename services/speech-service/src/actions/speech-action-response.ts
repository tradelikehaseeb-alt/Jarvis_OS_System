import type { SpeechAction } from "./speech-action";

/**
 * Deterministic response returned by routed speech actions (Phase 34).
 */
export interface SpeechActionResponse {
  readonly requestId: string;
  readonly handled: boolean;
  readonly action?: SpeechAction;
  readonly message: string;
}

import type { SpeechActionType } from "./speech-action-type";

/**
 * Resolved speech action metadata (Phase 34).
 */
export interface SpeechAction {
  readonly actionId: string;
  readonly type: SpeechActionType;
  readonly command: string;
  readonly description: string;
}

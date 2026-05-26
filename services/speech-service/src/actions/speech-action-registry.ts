import type { SpeechAction } from "./speech-action";
import type { SpeechActionHandler } from "./speech-action-handler";

export interface RegisteredSpeechAction {
  readonly action: SpeechAction;
  readonly handler: SpeechActionHandler;
}

/**
 * Registry contract for static command -> action handler mapping (Phase 34).
 */
export interface SpeechActionRegistry {
  register(action: SpeechAction, handler: SpeechActionHandler): void;
  resolve(command: string): RegisteredSpeechAction | undefined;
  list(): readonly RegisteredSpeechAction[];
}

import type { SpeechRecoveryAction } from "./speech-recovery-action";
import type { SpeechRecoveryReason } from "./speech-recovery-reason";

/**
 * Immutable recovery event recorded by the recovery manager (Phase 39).
 */
export interface SpeechRecoveryEvent {
  readonly eventId: string;
  readonly reason: SpeechRecoveryReason;
  readonly action: SpeechRecoveryAction;
  readonly providerId: string;
  readonly fallbackProviderId?: string;
  readonly message: string;
  readonly at: string;
}

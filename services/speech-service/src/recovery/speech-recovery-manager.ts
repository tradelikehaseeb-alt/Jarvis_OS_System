import type { SpeechRecoveryAction } from "./speech-recovery-action";
import type { SpeechRecoveryEvent } from "./speech-recovery-event";
import type { SpeechRecoveryReason } from "./speech-recovery-reason";

export interface SpeechFailureContext {
  readonly requestId: string;
  readonly providerId: string;
  readonly reason: SpeechRecoveryReason;
  readonly detail?: string;
}

export interface SpeechRecoveryResult {
  readonly action: SpeechRecoveryAction;
  readonly providerId: string;
  readonly fallbackProviderId?: string;
  readonly message: string;
  readonly event: SpeechRecoveryEvent;
}

/**
 * Recovery manager contract for deterministic speech failure handling (Phase 39).
 */
export interface SpeechRecoveryManager {
  handleFailure(context: SpeechFailureContext): SpeechRecoveryResult;
  selectFallback(providerId: string): string | undefined;
  retryOperation(context: SpeechFailureContext): SpeechRecoveryResult;
  getRecoveryHistory(): readonly SpeechRecoveryEvent[];
}

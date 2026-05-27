/**
 * Failure reasons handled by speech recovery layer (Phase 39).
 */
export type SpeechRecoveryReason =
  | "provider-unavailable"
  | "timeout"
  | "invalid-response"
  | "routing-failure"
  | "interrupted-session";

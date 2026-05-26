/**
 * Event vocabulary for speech event bus and stream foundation (Phase 32).
 */
export type SpeechEventType =
  | "session-created"
  | "listening-started"
  | "transcript-partial"
  | "transcript-final"
  | "normalization-completed"
  | "processing-started"
  | "speaking-started"
  | "session-completed"
  | "error";

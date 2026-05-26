/**
 * Session lifecycle states for speech orchestration (Phase 31).
 */
export type SpeechSessionState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "completed"
  | "error";

/**
 * Voice UI lifecycle states (Phase 25) — mock shell only, no STT/TTS.
 */
export type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "normalizing"
  | "completed"
  | "error";

/** Labels for status indicator display. */
export const VOICE_STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "Ready",
  listening: "Listening…",
  processing: "Processing…",
  normalizing: "Normalizing transcript…",
  completed: "Transcript ready",
  error: "Voice error",
};

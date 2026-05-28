/**
 * User-facing voice session states (Phase 90).
 */
export type VoiceSessionState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "executing"
  | "error";

export const VOICE_SESSION_STATE_LABELS: Record<VoiceSessionState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  executing: "Executing",
  error: "Voice error",
};

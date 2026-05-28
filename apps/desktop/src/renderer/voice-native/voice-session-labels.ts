import type { VoiceSessionState } from "@jarvis/speech-service";

/** User-facing voice state labels — no internal runtime names (Phase 90). */
export const VOICE_SESSION_DISPLAY_LABELS: Record<VoiceSessionState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  executing: "Executing",
  error: "Voice unavailable",
};

export function voiceSessionLabel(state: VoiceSessionState): string {
  return VOICE_SESSION_DISPLAY_LABELS[state];
}

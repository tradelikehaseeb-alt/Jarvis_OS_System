/**
 * Wake-word detection state for voice-native sessions (Phase 90).
 */
export type WakeWordState = "idle" | "armed" | "triggered";

export interface WakeWordConfig {
  /** Wake phrase to match (case-insensitive). Default: "jarvis". */
  readonly phrase: string;
  /** When false, wake-word gating is bypassed. */
  readonly enabled: boolean;
}

export const DEFAULT_WAKE_WORD_CONFIG: WakeWordConfig = {
  phrase: "jarvis",
  enabled: true,
};

export interface WakeWordDetectionResult {
  readonly state: WakeWordState;
  /** Transcript with wake phrase stripped when triggered. */
  readonly commandText: string;
  readonly matched: boolean;
}

/**
 * Deterministic wake-word detector for streaming/partial transcripts.
 */
export function detectWakeWord(
  transcript: string,
  config: WakeWordConfig = DEFAULT_WAKE_WORD_CONFIG,
  previousState: WakeWordState = "idle",
): WakeWordDetectionResult {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { state: previousState === "triggered" ? "triggered" : "idle", commandText: "", matched: false };
  }

  if (!config.enabled) {
    return { state: "triggered", commandText: trimmed, matched: true };
  }

  const phrase = config.phrase.trim().toLowerCase();
  const lower = trimmed.toLowerCase();

  if (lower === phrase) {
    return { state: "triggered", commandText: "", matched: true };
  }

  const prefix = `${phrase} `;
  const commaPrefix = `${phrase}, `;
  if (lower.startsWith(prefix) || lower.startsWith(commaPrefix)) {
    const stripLen = lower.startsWith(commaPrefix) ? commaPrefix.length : prefix.length;
    return {
      state: "triggered",
      commandText: trimmed.slice(stripLen).trim(),
      matched: true,
    };
  }

  if (lower.includes(phrase)) {
    const index = lower.indexOf(phrase);
    const after = trimmed.slice(index + phrase.length).replace(/^[\s,]+/, "").trim();
    return { state: "triggered", commandText: after, matched: true };
  }

  if (previousState === "armed" || previousState === "idle") {
    return { state: "armed", commandText: "", matched: false };
  }

  return { state: previousState, commandText: trimmed, matched: previousState === "triggered" };
}

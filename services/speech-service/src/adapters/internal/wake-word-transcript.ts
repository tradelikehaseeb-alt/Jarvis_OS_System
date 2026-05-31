const WAKE_PHRASES = [
  "hey jarvis",
  "ok jarvis",
  "okay jarvis",
  "jarvis",
] as const;

export interface WakeWordTranscriptResult {
  readonly text: string;
  readonly isWakeWord: boolean;
  readonly confidence: number;
}

/**
 * Detects wake phrases in a finalized transcript.
 */
export function detectWakeWordInTranscript(
  transcript: string,
): WakeWordTranscriptResult {
  const text = transcript.trim();
  if (text.length === 0) {
    return { text: "", isWakeWord: false, confidence: 0 };
  }

  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

  for (const phrase of WAKE_PHRASES) {
    if (normalized === phrase) {
      return { text, isWakeWord: true, confidence: 0.95 };
    }
    if (normalized.startsWith(`${phrase} `)) {
      return { text, isWakeWord: true, confidence: 0.92 };
    }
  }

  return { text, isWakeWord: false, confidence: 0.75 };
}

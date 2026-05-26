/**
 * Static mock transcripts for the voice shell (Phase 25).
 * Replace with STT output in a future phase.
 */
export const MOCK_VOICE_TRANSCRIPTS: readonly string[] = [
  "Plan my week with time for deep work and meetings",
  "Search for Jarvis API documentation",
  "Research competitor pricing for our product launch",
  "Automate opening the dashboard every morning",
  "Hello, what can you help me with today?",
] as const;

/** Pick a deterministic mock line from the catalog. */
export function pickMockTranscript(seed: number = Date.now()): string {
  const index = Math.abs(seed) % MOCK_VOICE_TRANSCRIPTS.length;
  return MOCK_VOICE_TRANSCRIPTS[index] ?? MOCK_VOICE_TRANSCRIPTS[0];
}

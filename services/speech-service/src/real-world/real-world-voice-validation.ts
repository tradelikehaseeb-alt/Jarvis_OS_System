import { REAL_WORLD_VOICE_COMMANDS } from "@jarvis/types";

export interface RealWorldVoiceValidation {
  readonly command: string;
  readonly recognized: boolean;
  readonly userLabel: string;
  readonly expectsBrowser: boolean;
}

/**
 * Maps real-world voice commands to validation metadata (Phase 100).
 */
export function mapRealWorldVoiceCommand(transcript: string): RealWorldVoiceValidation {
  const normalized = transcript.trim();
  const recognized = (REAL_WORLD_VOICE_COMMANDS as readonly string[]).some(
    (command) => command.toLowerCase() === normalized.toLowerCase(),
  );

  let userLabel = "Working…";
  if (/\b(youtube|gmail|open)\b/i.test(normalized)) {
    userLabel = "Performing task…";
  } else if (/\b(gold|market|summarize)\b/i.test(normalized)) {
    userLabel = "Researching…";
  } else if (/\b(workspace|trading)\b/i.test(normalized)) {
    userLabel = "Preparing workspace…";
  }

  return {
    command: normalized,
    recognized,
    userLabel,
    expectsBrowser: /\b(open|gmail|youtube|workspace)\b/i.test(normalized),
  };
}

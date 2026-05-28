import type { TaskIntent } from "@jarvis/types";

export interface VoiceBrowserWorkflowHint {
  readonly automate: boolean;
  readonly description: string;
  readonly url?: string;
  readonly includesSummarize: boolean;
}

const AUTOMATE_PATTERN =
  /\b(open|navigate|go to|launch|summarize|click|fill|browse)\b/i;
const SUMMARIZE_PATTERN = /\b(summarize|summary|unread|read emails?)\b/i;

/**
 * Maps voice transcripts to browser workflow hints for orchestrator routing (Phase 95).
 */
export function mapVoiceTranscriptToBrowserWorkflow(
  transcript: string,
): VoiceBrowserWorkflowHint | undefined {
  const description = transcript.trim();
  if (!description || !AUTOMATE_PATTERN.test(description)) {
    return undefined;
  }

  const lower = description.toLowerCase();
  let url: string | undefined;
  if (lower.includes("gmail")) {
    url = "https://mail.google.com";
  }

  return {
    automate: true,
    description,
    url,
    includesSummarize: SUMMARIZE_PATTERN.test(description),
  };
}

export function voiceHintToTaskIntent(hint: VoiceBrowserWorkflowHint): TaskIntent {
  return {
    kind: "automate",
    description: hint.description,
  };
}

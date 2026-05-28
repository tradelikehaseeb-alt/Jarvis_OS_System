import type { TaskIntent } from "@jarvis/types";
import { normalizeDemoScenarioCommand } from "@jarvis/types";

export interface VoiceBrowserWorkflowHint {
  readonly automate: boolean;
  readonly description: string;
  readonly url?: string;
  readonly includesSummarize: boolean;
  readonly includesMemory: boolean;
}

const AUTOMATE_PATTERN =
  /\b(open|navigate|go to|launch|summarize|click|fill|browse|search|check|prepare|remember)\b/i;
const SUMMARIZE_PATTERN = /\b(summarize|summary|unread|read emails?|ai news)\b/i;
const MEMORY_PATTERN = /\bremember\b/i;

const URL_HINTS: Readonly<Record<string, string>> = {
  gmail: "https://mail.google.com",
  youtube: "https://www.youtube.com",
  tradingview: "https://www.tradingview.com",
};

/**
 * Maps voice transcripts to browser workflow hints for orchestrator routing (Phase 95 / 96).
 */
export function mapVoiceTranscriptToBrowserWorkflow(
  transcript: string,
): VoiceBrowserWorkflowHint | undefined {
  const description = normalizeDemoScenarioCommand(transcript.trim());
  if (!description || !AUTOMATE_PATTERN.test(description)) {
    return undefined;
  }

  const lower = description.toLowerCase();
  let url: string | undefined;
  for (const [hint, hintUrl] of Object.entries(URL_HINTS)) {
    if (lower.includes(hint)) {
      url = hintUrl;
      break;
    }
  }

  return {
    automate: !MEMORY_PATTERN.test(lower) || Boolean(url),
    description: transcript.trim(),
    url,
    includesSummarize: SUMMARIZE_PATTERN.test(description),
    includesMemory: MEMORY_PATTERN.test(description),
  };
}

export function voiceHintToTaskIntent(hint: VoiceBrowserWorkflowHint): TaskIntent {
  if (hint.includesMemory && !hint.url) {
    return {
      kind: "plan",
      description: hint.description,
    };
  }

  return {
    kind: "automate",
    description: hint.description,
  };
}

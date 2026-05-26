import type { SpeechContext } from "./speech-context";

/**
 * STT-style homophone / mis-hearing correction rule (Phase 26).
 */
export interface TranscriptCorrectionRule {
  readonly id: string;
  readonly pattern: RegExp;
  readonly replacement: string;
  readonly description: string;
  readonly domain?: SpeechContext["domain"];
}

export interface ApplyTranscriptCorrectionsResult {
  readonly text: string;
  readonly appliedCorrectionIds: readonly string[];
}

/** Deterministic phonetic / STT error fixes (no LLM). */
export const TRANSCRIPT_CORRECTION_RULES: readonly TranscriptCorrectionRule[] = [
  {
    id: "stt-for-eggs-analysis",
    domain: "trading",
    pattern: /\bfor\s+eggs\s+analysis\b/gi,
    replacement: "forex analysis",
    description: "for eggs analysis → forex analysis",
  },
  {
    id: "stt-for-eggs",
    domain: "trading",
    pattern: /\bfor\s+eggs\b/gi,
    replacement: "forex",
    description: "for eggs → forex",
  },
  {
    id: "stt-four-eggs",
    domain: "trading",
    pattern: /\bfour\s+eggs\b/gi,
    replacement: "forex",
    description: "four eggs → forex",
  },
  {
    id: "stt-forex-spaced",
    domain: "trading",
    pattern: /\bfor\s+ex\b/gi,
    replacement: "forex",
    description: "for ex → forex",
  },
  {
    id: "stt-gold-chart",
    domain: "trading",
    pattern: /\bgoal\s+chart\b/gi,
    replacement: "gold chart",
    description: "goal chart → gold chart (common STT slip)",
  },
] as const;

function ruleMatchesDomain(
  rule: TranscriptCorrectionRule,
  context: SpeechContext,
): boolean {
  if (!rule.domain) {
    return true;
  }
  return rule.domain === (context.domain ?? "general");
}

/**
 * Apply {@link TRANSCRIPT_CORRECTION_RULES} before Roman Urdu normalization.
 */
export function applyTranscriptCorrections(
  text: string,
  context: SpeechContext,
  rules: readonly TranscriptCorrectionRule[] = TRANSCRIPT_CORRECTION_RULES,
): ApplyTranscriptCorrectionsResult {
  const appliedCorrectionIds: string[] = [];
  let current = text;

  for (const rule of rules) {
    if (!ruleMatchesDomain(rule, context)) {
      continue;
    }
    const next = current.replace(rule.pattern, rule.replacement);
    if (next !== current) {
      appliedCorrectionIds.push(rule.id);
      current = next;
    }
  }

  return { text: current, appliedCorrectionIds };
}

/**
 * {@link TranscriptCorrection} — facade for STT homophone fixes (Phase 26).
 */
export class TranscriptCorrection {
  constructor(
    private readonly rules: readonly TranscriptCorrectionRule[] = TRANSCRIPT_CORRECTION_RULES,
  ) {}

  correct(
    text: string,
    context: SpeechContext = {},
  ): ApplyTranscriptCorrectionsResult {
    return applyTranscriptCorrections(text, context, this.rules);
  }
}

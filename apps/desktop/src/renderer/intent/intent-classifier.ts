import type { ChatIntentType, IntentClassification } from "./intent-types";

interface IntentRule {
  readonly id: string;
  readonly intent: ChatIntentType;
  readonly confidence: number;
  readonly test: (normalized: string, tokens: readonly string[]) => boolean;
  readonly reason: string;
}

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenize(normalized: string): readonly string[] {
  return normalized.split(/[^a-z0-9]+/).filter(Boolean);
}

function includesAnyPhrase(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function includesAnyToken(tokens: readonly string[], words: readonly string[]): boolean {
  return words.some((word) => tokens.includes(word));
}

function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/** Deterministic rules — first match wins (Phase 24). */
const INTENT_RULES: readonly IntentRule[] = [
  {
    id: "automate-keywords",
    intent: "automate",
    confidence: 0.92,
    reason: "Message mentions automation or execution keywords",
    test: (text, tokens) =>
      includesAnyPhrase(text, [
        "automate",
        "automation",
        "run script",
        "workflow",
        "open app",
        "click ",
        "desktop app",
        "macro",
      ]) ||
      includesAnyToken(tokens, [
        "automate",
        "automation",
        "script",
        "workflow",
        "macro",
        "execute",
      ]),
  },
  {
    id: "plan-keywords",
    intent: "plan",
    confidence: 0.9,
    reason: "Message requests planning or scheduling",
    test: (text, tokens) =>
      includesAnyPhrase(text, [
        "plan my",
        "plan the",
        "roadmap",
        "schedule",
        "sprint",
        "milestone",
        "organize my week",
        "organize my day",
      ]) ||
      includesAnyToken(tokens, ["plan", "schedule", "roadmap", "sprint", "organize"]),
  },
  {
    id: "search-keywords",
    intent: "search",
    confidence: 0.88,
    reason: "Message looks like a search or lookup request",
    test: (text, tokens) =>
      matchesAnyPattern(text, [
        /\bsearch\b/,
        /\blook\s+up\b/,
        /\blookup\b/,
        /\bfind\s+me\b/,
        /\bfind\s+the\b/,
        /\bwhere\s+is\b/,
      ]) ||
      (includesAnyToken(tokens, ["search", "find", "lookup"]) &&
        !includesAnyToken(tokens, ["research", "investigate"])),
  },
  {
    id: "research-keywords",
    intent: "research",
    confidence: 0.86,
    reason: "Message requests research or analysis",
    test: (text, tokens) =>
      includesAnyPhrase(text, [
        "research",
        "investigate",
        "analyze",
        "analysis",
        "compare",
        "survey",
        "study ",
      ]) ||
      includesAnyToken(tokens, [
        "research",
        "investigate",
        "analyze",
        "compare",
        "survey",
        "study",
      ]),
  },
  {
    id: "conversation-greeting",
    intent: "conversation",
    confidence: 0.84,
    reason: "Short conversational or greeting message",
    test: (text, tokens) => {
      if (text.length > 80) {
        return false;
      }
      return (
        includesAnyPhrase(text, [
          "hello",
          "hi ",
          "hi!",
          "hey ",
          "thanks",
          "thank you",
          "good morning",
          "good evening",
          "how are you",
          "what's up",
          "whats up",
        ]) ||
        (tokens.length <= 4 &&
          includesAnyToken(tokens, [
            "hi",
            "hey",
            "hello",
            "thanks",
            "yo",
            "sup",
          ]))
      );
    },
  },
  {
    id: "conversation-question-short",
    intent: "conversation",
    confidence: 0.8,
    reason: "Brief question without task-oriented keywords",
    test: (text, tokens) =>
      text.endsWith("?") &&
      text.length < 60 &&
      tokens.length <= 8 &&
      !includesAnyToken(tokens, [
        "plan",
        "search",
        "find",
        "automate",
        "research",
        "run",
      ]),
  },
];

const FALLBACK_RULE: IntentRule = {
  id: "fallback-research",
  intent: "research",
  confidence: 0.65,
  reason: "No specific rule matched — defaulting to research",
  test: () => true,
};

/**
 * Classify user chat text with deterministic keyword rules (Phase 24).
 *
 * No LLM calls. Output is stable for the same input.
 */
export function classifyChatIntent(message: string): IntentClassification {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return {
      intent: "conversation",
      ruleId: "empty-message",
      reason: "Empty message treated as conversation",
      confidence: 1,
    };
  }

  const tokens = tokenize(normalized);

  for (const rule of INTENT_RULES) {
    if (rule.test(normalized, tokens)) {
      return {
        intent: rule.intent,
        ruleId: rule.id,
        reason: rule.reason,
        confidence: rule.confidence,
      };
    }
  }

  return {
    intent: FALLBACK_RULE.intent,
    ruleId: FALLBACK_RULE.id,
    reason: FALLBACK_RULE.reason,
    confidence: FALLBACK_RULE.confidence,
  };
}

/** Loading copy keyed by classified intent (preserves Hermes planning UX for `plan`). */
export function loadingMessageForIntent(intent: ChatIntentType): string {
  if (intent === "plan") {
    return "Hermes is planning…";
  }
  if (intent === "automate") {
    return "Routing to execution agent…";
  }
  if (intent === "search" || intent === "research") {
    return "Hermes is researching…";
  }
  return "Jarvis is working…";
}

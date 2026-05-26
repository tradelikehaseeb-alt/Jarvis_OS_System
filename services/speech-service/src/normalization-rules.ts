import type { LanguageDetectionResult } from "./language-detector";
import type { SpeechContext } from "./speech-context";

/**
 * A single deterministic normalization rule (Phase 26).
 */
export interface NormalizationRule {
  readonly id: string;
  /** When set, rule runs only for these detected primary languages. */
  readonly languages?: readonly ("en" | "ur-roman" | "mixed")[];
  /** When set, rule runs only for this domain. */
  readonly domain?: SpeechContext["domain"];
  readonly pattern: RegExp;
  readonly replacement: string;
  readonly description: string;
}

export interface ApplyNormalizationRulesResult {
  readonly text: string;
  readonly appliedRuleIds: readonly string[];
}

/**
 * Roman Urdu phrase + token rules and English cleanup (Phase 26).
 *
 * Rules are applied in array order — phrase rules before word rules.
 */
export const NORMALIZATION_RULES: readonly NormalizationRule[] = [
  {
    id: "ur-phrase-open-chart",
    languages: ["ur-roman", "mixed"],
    pattern: /\bmera\s+(\w+)\s+ka\s+chart\s+kholo\b/gi,
    replacement: "open my $1 chart",
    description: "mera X ka chart kholo → open my X chart",
  },
  {
    id: "ur-phrase-show-chart",
    languages: ["ur-roman", "mixed"],
    pattern: /\bmera\s+(\w+)\s+ka\s+chart\s+dikhao\b/gi,
    replacement: "show my $1 chart",
    description: "mera X ka chart dikhao → show my X chart",
  },
  {
    id: "ur-phrase-close-chart",
    languages: ["ur-roman", "mixed"],
    pattern: /\b(\w+)\s+ka\s+chart\s+band\s+karo\b/gi,
    replacement: "close $1 chart",
    description: "X ka chart band karo → close X chart",
  },
  {
    id: "ur-word-kholo",
    languages: ["ur-roman", "mixed"],
    pattern: /\bkholo\b/gi,
    replacement: "open",
    description: "kholo → open",
  },
  {
    id: "ur-word-dikhao",
    languages: ["ur-roman", "mixed"],
    pattern: /\bdikhao\b/gi,
    replacement: "show",
    description: "dikhao → show",
  },
  {
    id: "ur-word-band-karo",
    languages: ["ur-roman", "mixed"],
    pattern: /\bband\s+karo\b/gi,
    replacement: "close",
    description: "band karo → close",
  },
  {
    id: "ur-word-mera",
    languages: ["ur-roman", "mixed"],
    pattern: /\bmera\b/gi,
    replacement: "my",
    description: "mera → my",
  },
  {
    id: "ur-word-meri",
    languages: ["ur-roman", "mixed"],
    pattern: /\bmeri\b/gi,
    replacement: "my",
    description: "meri → my",
  },
  {
    id: "ur-word-mere",
    languages: ["ur-roman", "mixed"],
    pattern: /\bmere\b/gi,
    replacement: "my",
    description: "mere → my",
  },
  {
    id: "ur-word-mujhe",
    languages: ["ur-roman", "mixed"],
    pattern: /\bmujhe\b/gi,
    replacement: "me",
    description: "mujhe → me",
  },
  {
    id: "ur-word-nahi",
    languages: ["ur-roman", "mixed"],
    pattern: /\b(nahi|nahin)\b/gi,
    replacement: "not",
    description: "nahi/nahin → not",
  },
  {
    id: "ur-particle-ka",
    languages: ["ur-roman", "mixed"],
    pattern: /\s+ka\s+/gi,
    replacement: " ",
    description: "Remove possessive particle ka between words",
  },
  {
    id: "ur-particle-ki",
    languages: ["ur-roman", "mixed"],
    pattern: /\s+ki\s+/gi,
    replacement: " ",
    description: "Remove possessive particle ki",
  },
  {
    id: "ur-particle-ke",
    languages: ["ur-roman", "mixed"],
    pattern: /\s+ke\s+/gi,
    replacement: " ",
    description: "Remove possessive particle ke",
  },
  {
    id: "cleanup-whitespace",
    pattern: /\s{2,}/g,
    replacement: " ",
    description: "Collapse repeated spaces",
  },
  {
    id: "cleanup-trim-edges",
    pattern: /^\s+|\s+$/g,
    replacement: "",
    description: "Trim leading/trailing whitespace",
  },
] as const;

function ruleMatchesContext(
  rule: NormalizationRule,
  context: SpeechContext,
  language: LanguageDetectionResult,
): boolean {
  if (rule.domain && rule.domain !== (context.domain ?? "general")) {
    return false;
  }
  if (rule.languages && !rule.languages.includes(language.primary)) {
    return false;
  }
  return true;
}

/**
 * Apply {@link NORMALIZATION_RULES} to transcript text.
 */
export function applyNormalizationRules(
  text: string,
  context: SpeechContext,
  language: LanguageDetectionResult,
  rules: readonly NormalizationRule[] = NORMALIZATION_RULES,
): ApplyNormalizationRulesResult {
  const appliedRuleIds: string[] = [];
  let current = text;

  for (const rule of rules) {
    if (!ruleMatchesContext(rule, context, language)) {
      continue;
    }
    const next = current.replace(rule.pattern, rule.replacement);
    if (next !== current) {
      appliedRuleIds.push(rule.id);
      current = next;
    }
  }

  return { text: current.trim(), appliedRuleIds };
}

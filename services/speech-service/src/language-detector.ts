/**
 * Detects English vs Roman Urdu (Latin-script Urdu) mix in a transcript (Phase 26).
 *
 * Heuristic token matching only — no ML or external language models.
 */

/** Detected language profile for a transcript. */
export type DetectedLanguage = "en" | "ur-roman" | "mixed";

export interface LanguageDetectionResult {
  readonly primary: DetectedLanguage;
  /** Share of tokens matching English function/content words (0–1). */
  readonly englishRatio: number;
  /** Share of tokens matching Roman Urdu markers (0–1). */
  readonly romanUrduRatio: number;
  readonly tokenCount: number;
}

/** Common Roman Urdu tokens in Latin script (STT / voice chat). */
const ROMAN_URDU_MARKERS = new Set([
  "mera",
  "meri",
  "mere",
  "apka",
  "apki",
  "apke",
  "mujhe",
  "mujhay",
  "tumhe",
  "tumhay",
  "kholo",
  "band",
  "karo",
  "karein",
  "karna",
  "karni",
  "hai",
  "hain",
  "ho",
  "tha",
  "thi",
  "the",
  "ka",
  "ki",
  "ke",
  "ko",
  "se",
  "par",
  "mein",
  "main",
  "yeh",
  "ye",
  "woh",
  "wo",
  "kya",
  "kyun",
  "kyon",
  "nahi",
  "nahin",
  "batao",
  "dikhao",
  "dekh",
  "dekhna",
  "chahiye",
  "sakta",
  "sakti",
  "sakte",
  "jaldi",
  "abhi",
  "kal",
  "aaj",
]);

/** High-frequency English tokens for ratio estimation. */
const ENGLISH_MARKERS = new Set([
  "the",
  "a",
  "an",
  "my",
  "your",
  "open",
  "close",
  "show",
  "find",
  "search",
  "plan",
  "chart",
  "analysis",
  "forex",
  "gold",
  "stock",
  "please",
  "help",
  "what",
  "how",
  "when",
  "where",
  "is",
  "are",
  "was",
  "for",
  "to",
  "and",
  "or",
]);

function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Deterministic language detection for Roman Urdu + English transcripts.
 */
export class LanguageDetector {
  detect(transcript: string): LanguageDetectionResult {
    const tokens = tokenize(transcript);

    if (tokens.length === 0) {
      return {
        primary: "en",
        englishRatio: 0,
        romanUrduRatio: 0,
        tokenCount: 0,
      };
    }

    let englishHits = 0;
    let urduHits = 0;

    for (const token of tokens) {
      if (ROMAN_URDU_MARKERS.has(token)) {
        urduHits += 1;
      }
      if (ENGLISH_MARKERS.has(token)) {
        englishHits += 1;
      }
    }

    const romanUrduRatio = urduHits / tokens.length;
    const englishRatio = englishHits / tokens.length;

    let primary: DetectedLanguage;
    if (urduHits > 0 && englishHits > 0) {
      primary = "mixed";
    } else if (urduHits > 0) {
      primary = "ur-roman";
    } else {
      primary = "en";
    }

    return {
      primary,
      englishRatio,
      romanUrduRatio,
      tokenCount: tokens.length,
    };
  }
}

/** Shared singleton for convenience. */
export const defaultLanguageDetector = new LanguageDetector();

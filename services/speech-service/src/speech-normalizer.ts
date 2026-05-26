import {
  LanguageDetector,
  defaultLanguageDetector,
  type LanguageDetectionResult,
} from "./language-detector";
import {
  NORMALIZATION_RULES,
  applyNormalizationRules,
  type NormalizationRule,
} from "./normalization-rules";
import {
  DEFAULT_SPEECH_CONTEXT,
  type SpeechContext,
} from "./speech-context";
import {
  TranscriptCorrection,
  type TranscriptCorrectionRule,
} from "./transcript-correction";

/**
 * Result of {@link SpeechNormalizer.normalize} (Phase 26).
 */
export interface NormalizationResult {
  readonly original: string;
  readonly normalized: string;
  readonly language: LanguageDetectionResult;
  readonly appliedCorrections: readonly string[];
  readonly appliedRules: readonly string[];
}

export interface SpeechNormalizerOptions {
  readonly languageDetector?: LanguageDetector;
  readonly transcriptCorrection?: TranscriptCorrection;
  readonly normalizationRules?: readonly NormalizationRule[];
  readonly correctionRules?: readonly TranscriptCorrectionRule[];
}

/**
 * Normalizes raw STT transcript text — Roman Urdu + English, deterministic only (Phase 26).
 *
 * Pipeline: detect language → STT corrections → phrase/word rules → trim.
 * No audio, LLM, or external services.
 */
export class SpeechNormalizer {
  private readonly languageDetector: LanguageDetector;
  private readonly transcriptCorrection: TranscriptCorrection;
  private readonly normalizationRules: readonly NormalizationRule[];

  constructor(options: SpeechNormalizerOptions = {}) {
    this.languageDetector =
      options.languageDetector ?? defaultLanguageDetector;
    this.transcriptCorrection =
      options.transcriptCorrection ??
      new TranscriptCorrection(options.correctionRules);
    this.normalizationRules =
      options.normalizationRules ?? NORMALIZATION_RULES;
  }

  /**
   * Normalize transcript text using optional {@link SpeechContext}.
   */
  normalize(
    transcript: string,
    context: SpeechContext = DEFAULT_SPEECH_CONTEXT,
  ): NormalizationResult {
    const original = transcript;
    const preprocessed = original.replace(/\s+/g, " ").trim();

    const language = this.languageDetector.detect(preprocessed);

    const correction = this.transcriptCorrection.correct(preprocessed, context);

    const rules = applyNormalizationRules(
      correction.text,
      context,
      language,
      this.normalizationRules,
    );

    return {
      original,
      normalized: rules.text,
      language,
      appliedCorrections: correction.appliedCorrectionIds,
      appliedRules: rules.appliedRuleIds,
    };
  }
}

/** Default normalizer instance. */
export const defaultSpeechNormalizer = new SpeechNormalizer();

/**
 * Convenience — normalize transcript with default components.
 */
export function normalizeTranscript(
  transcript: string,
  context?: SpeechContext,
): NormalizationResult {
  return defaultSpeechNormalizer.normalize(transcript, context);
}

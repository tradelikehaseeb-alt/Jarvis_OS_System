/**
 * @jarvis/speech-service — transcript normalization (Phase 26).
 *
 * Text-in / text-out cleanup for Roman Urdu + English before future STT wiring.
 * No STT, TTS, microphone, or LLM.
 */

export type { SpeechContext, SpeechDomain } from "./speech-context";
export { DEFAULT_SPEECH_CONTEXT } from "./speech-context";

export type {
  DetectedLanguage,
  LanguageDetectionResult,
} from "./language-detector";
export {
  LanguageDetector,
  defaultLanguageDetector,
} from "./language-detector";

export type {
  NormalizationRule,
  ApplyNormalizationRulesResult,
} from "./normalization-rules";
export {
  NORMALIZATION_RULES,
  applyNormalizationRules,
} from "./normalization-rules";

export type {
  TranscriptCorrectionRule,
  ApplyTranscriptCorrectionsResult,
} from "./transcript-correction";
export {
  TRANSCRIPT_CORRECTION_RULES,
  applyTranscriptCorrections,
  TranscriptCorrection,
} from "./transcript-correction";

export type {
  NormalizationResult,
  SpeechNormalizerOptions,
} from "./speech-normalizer";
export {
  SpeechNormalizer,
  defaultSpeechNormalizer,
  normalizeTranscript,
} from "./speech-normalizer";

export type {
  SpeechProviderConfig,
  SpeechRequest,
  SpeechResponse,
  SpeechToTextAdapter,
  TextToSpeechAdapter,
} from "./adapters";
export {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  SpeechAdapterRegistry,
  StubSpeechToTextAdapter,
  StubTextToSpeechAdapter,
} from "./adapters";

export type {
  SpeechRuntimeStatus,
  SpeechRuntimeProviderId,
  SpeechRuntimeHealth,
  SpeechRuntimeProvider,
  SpeechRuntimeManager,
  SpeechRuntimeResolver,
} from "./runtime";
export {
  MockSpeechRuntimeProvider,
  InMemorySpeechRuntimeManager,
  createDefaultSpeechRuntimeResolver,
} from "./runtime";

/** Module identifiers for structure tests. */
export const SPEECH_SERVICE_MODULE_IDS = [
  "speech-context",
  "language-detector",
  "transcript-correction",
  "normalization-rules",
  "speech-normalizer",
  "adapters",
  "runtime",
] as const;

export type SpeechServiceModuleId = (typeof SPEECH_SERVICE_MODULE_IDS)[number];

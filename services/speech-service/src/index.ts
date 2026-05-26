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

export type {
  SpeechCapability,
  SpeechCapabilityMatch,
  SpeechRoutingDecision,
  SpeechSelectionContext,
  SpeechSelectionPolicy,
  SpeechCapabilityRouteRequest,
} from "./routing";
export {
  DefaultSpeechSelectionPolicy,
  SpeechCapabilityResolver,
  SpeechCapabilityRouter,
  createDefaultSpeechCapabilityRouter,
} from "./routing";

export type {
  SpeechSessionState,
  SpeechSessionEvent,
  SpeechSession,
  SpeechSessionManager,
} from "./session";
export {
  SpeechSessionFactory,
  InMemorySpeechSessionManager,
  createDefaultSpeechSessionManager,
} from "./session";

export type {
  SpeechEventType,
  SpeechEvent,
  SpeechEventListener,
  SpeechEventBus,
  SpeechStreamChunk,
  SpeechStreamSession,
  SpeechStreamManager,
} from "./events";
export {
  InMemorySpeechEventBus,
  InMemorySpeechStreamManager,
  createDefaultSpeechEventBus,
} from "./events";

export type {
  SpeechConversation,
  SpeechConversationState,
  SpeechConversationTurn,
  SpeechConversationContext,
  SpeechInterruptionEvent,
  SpeechConversationManager,
} from "./conversation";
export {
  DEFAULT_SPEECH_CONVERSATION_CONTEXT,
  InMemorySpeechConversationManager,
  createDefaultSpeechConversationManager,
} from "./conversation";

export type {
  SpeechAction,
  SpeechActionType,
  SpeechActionRequest,
  SpeechActionResponse,
  SpeechActionHandler,
  RegisteredSpeechAction,
  SpeechActionRegistry,
} from "./actions";
export {
  InMemorySpeechActionRegistry,
  SpeechActionRouter,
  createDefaultSpeechActionRouter,
} from "./actions";

export type {
  SpeechGatewayRequest,
  SpeechGatewayResponse,
  SpeechGateway,
  SpeechGatewayFactory,
} from "./gateway";
export { DefaultSpeechGateway, createDefaultSpeechGateway } from "./gateway";

export type {
  SpeechTraceLevel,
  SpeechTraceEvent,
  SpeechTraceContext,
  SpeechMetrics,
  SpeechTelemetryCollector,
} from "./telemetry";
export {
  InMemorySpeechTelemetryCollector,
  SpeechTraceRecorder,
  createDefaultSpeechTelemetry,
} from "./telemetry";

/** Module identifiers for structure tests. */
export const SPEECH_SERVICE_MODULE_IDS = [
  "speech-context",
  "language-detector",
  "transcript-correction",
  "normalization-rules",
  "speech-normalizer",
  "adapters",
  "runtime",
  "routing",
  "session",
  "events",
  "conversation",
  "actions",
  "gateway",
  "telemetry",
] as const;

export type SpeechServiceModuleId = (typeof SPEECH_SERVICE_MODULE_IDS)[number];

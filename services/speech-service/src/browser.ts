/**
 * Browser/Electron-renderer safe speech surface — no Node child_process or Python.
 */
export type { SpeechRequest } from "./adapters/speech-request";
export type { SpeechResponse } from "./adapters/speech-response";
export { stripMarkdownForSpeech } from "./adapters/internal/markdown-strip";
export { detectWakeWordInTranscript } from "./adapters/internal/wake-word-transcript";

import { StubSpeechToTextAdapterLegacy } from "./adapters/stub-speech-to-text-adapter-legacy";
import { StubTextToSpeechAdapterLegacy } from "./adapters/stub-text-to-speech-adapter-legacy";
import type { SpeechResponse } from "./adapters/speech-response";

const browserStt = new StubSpeechToTextAdapterLegacy();
const browserTts = new StubTextToSpeechAdapterLegacy();

export async function transcribe(
  audioBuffer: Buffer,
  options: {
    readonly requestId?: string;
    readonly mimeType?: string;
    readonly hintText?: string;
  } = {},
): Promise<SpeechResponse> {
  return browserStt.transcribe({
    requestId: options.requestId ?? `stt-${Date.now()}`,
    text: options.hintText ?? "",
    audioBase64: audioBuffer.toString("base64"),
    mimeType: options.mimeType ?? "audio/webm",
  });
}

export async function speak(
  text: string,
  options: { readonly requestId?: string } = {},
): Promise<SpeechResponse> {
  return browserTts.synthesize({
    requestId: options.requestId ?? `tts-${Date.now()}`,
    text,
  });
}

export type {
  MicrophoneAudioFrame,
  MicrophoneLevelSample,
  MicrophoneCaptureOptions,
  MicrophoneRuntime,
} from "./real-time/microphone-runtime";
export { SyntheticMicrophoneRuntime } from "./real-time/microphone-runtime";

export type {
  TranscriptionPartial,
  TranscriptionListener,
} from "./real-time/real-time-transcription-session";
export { RealTimeTranscriptionSession } from "./real-time/real-time-transcription-session";

export {
  StreamingSpeechRuntime,
  createDefaultStreamingSpeechRuntime,
  type StreamingSpeechRuntimeOptions,
} from "./real-time/streaming-speech-runtime";

export {
  VoicePlaybackController,
  createDefaultVoicePlaybackController,
  type VoicePlaybackChunk,
  type VoicePlaybackControllerOptions,
} from "./real-time/voice-playback-controller";

export {
  createRealTimeVoiceCaptureDelegate,
  type RealTimeVoiceCaptureResult,
} from "./real-time/create-real-time-voice-capture-delegate";
export { createRealTimeVoiceSpeechDelegate } from "./real-time/create-real-time-voice-speech-delegate";

export {
  naturalWordDelayMs,
  stabilizePartialTranscript,
} from "./real-time/speech-timing";

export type { VoiceSessionMode } from "./voice-session/voice-session-mode";
export { DEFAULT_VOICE_SESSION_MODE } from "./voice-session/voice-session-mode";
export type { VoiceSessionState } from "./voice-session/voice-session-state";
export type { WakeWordState } from "./voice-session/wake-word-state";
export {
  DEFAULT_WAKE_WORD_CONFIG,
  detectWakeWord,
} from "./voice-session/wake-word-state";
export { VOICE_SESSION_STATE_LABELS } from "./voice-session/voice-session-state";

export {
  createDefaultVoiceSessionRuntime,
  type VoiceSessionRuntime,
  type VoiceSessionCaptureDelegate,
  type VoiceSessionSpeechDelegate,
} from "./voice-session/create-default-voice-session-runtime";

export { createDefaultVoiceExecutionRuntime } from "./voice-execution/create-default-voice-execution-runtime";
export type { VoiceExecutionRuntime } from "./voice-execution/voice-execution-runtime";
export type { VoiceExecutionResult } from "./voice-execution/voice-execution-result";

export {
  SpeechNormalizer,
  defaultSpeechNormalizer,
  normalizeTranscript,
} from "./speech-normalizer";

export {
  createDefaultSpeechConversationManager,
} from "./conversation/create-default-speech-conversation-manager";

export {
  createDefaultSpeechGateway,
} from "./gateway/speech-gateway-factory";

export {
  createDefaultSpeechTelemetry,
} from "./telemetry/create-default-speech-telemetry";

/**
 * Browser/Electron-renderer safe speech surface — delegates STT/TTS to main IPC.
 */
export type { SpeechRequest } from "./adapters/speech-request";
export type { SpeechResponse } from "./adapters/speech-response";
export { stripMarkdownForSpeech } from "./adapters/internal/markdown-strip";
export { detectWakeWordInTranscript } from "./adapters/internal/wake-word-transcript";
export {
  arrayBufferToBase64,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from "./browser-safe-base64";

import { StubSpeechToTextAdapterLegacy } from "./adapters/stub-speech-to-text-adapter-legacy";
import { StubTextToSpeechAdapterLegacy } from "./adapters/stub-text-to-speech-adapter-legacy";
import type { SpeechResponse } from "./adapters/speech-response";
import { arrayBufferToBase64 } from "./browser-safe-base64";

const browserStt = new StubSpeechToTextAdapterLegacy();
const browserTts = new StubTextToSpeechAdapterLegacy();

export type BrowserAudioInput =
  | Uint8Array
  | ArrayBuffer
  | { readonly audioBase64: string };

function isTestEnvironment(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    return true;
  }
  if (typeof import.meta !== "undefined") {
    const env = import.meta as ImportMeta & {
      env?: { MODE?: string; NODE_ENV?: string };
    };
    return env.env?.MODE === "test" || env.env?.NODE_ENV === "test";
  }
  return false;
}

function toAudioBase64(audio: BrowserAudioInput): string {
  if (audio instanceof Uint8Array) {
    const chunkSize = 0x8000;
    let binary = "";
    for (let offset = 0; offset < audio.length; offset += chunkSize) {
      const slice = audio.subarray(offset, offset + chunkSize);
      binary += String.fromCharCode(...slice);
    }
    return btoa(binary);
  }
  if (audio instanceof ArrayBuffer) {
    return arrayBufferToBase64(audio);
  }
  return audio.audioBase64;
}

interface DesktopSpeechBridge {
  speechInit(): Promise<{
    ready: boolean;
    sttEngine: string;
    ttsEngine: string;
  }>;
  speechTranscribe(request: {
    audioBase64: string;
    mimeType?: string;
    requestId?: string;
  }): Promise<SpeechResponse>;
  speechSpeak(request: {
    text: string;
    requestId?: string;
    voice?: string;
  }): Promise<SpeechResponse>;
}

interface JarvisBrowserWindow {
  jarvis?: DesktopSpeechBridge;
}

const safeWindow = (() => {
  const candidate = (globalThis as { window?: JarvisBrowserWindow }).window;
  return typeof candidate !== "undefined" ? candidate : null;
})();

let browserBridgeWarningLogged = false;

function desktopSpeechBridge(): DesktopSpeechBridge | undefined {
  if (!safeWindow) {
    if (!browserBridgeWarningLogged) {
      console.warn(
        "[speech-service] window unavailable — skipping browser IPC bridge initialization",
      );
      browserBridgeWarningLogged = true;
    }
    return undefined;
  }

  const bridge = safeWindow.jarvis;
  if (
    bridge &&
    typeof bridge.speechTranscribe === "function" &&
    typeof bridge.speechSpeak === "function"
  ) {
    return bridge;
  }
  return undefined;
}

export async function transcribe(
  audio: BrowserAudioInput,
  options: {
    readonly requestId?: string;
    readonly mimeType?: string;
    readonly hintText?: string;
  } = {},
): Promise<SpeechResponse> {
  const ipc = desktopSpeechBridge();
  if (ipc && !isTestEnvironment()) {
    return ipc.speechTranscribe({
      audioBase64: toAudioBase64(audio),
      mimeType: options.mimeType ?? "audio/webm",
      requestId: options.requestId,
    });
  }

  return browserStt.transcribe({
    requestId: options.requestId ?? `stt-${Date.now()}`,
    text: options.hintText ?? "",
    audioBase64: toAudioBase64(audio),
    mimeType: options.mimeType ?? "audio/webm",
  });
}

export async function speak(
  text: string,
  options: { readonly requestId?: string } = {},
): Promise<SpeechResponse> {
  const ipc = desktopSpeechBridge();
  if (ipc && !isTestEnvironment()) {
    return ipc.speechSpeak({
      text,
      requestId: options.requestId,
    });
  }

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

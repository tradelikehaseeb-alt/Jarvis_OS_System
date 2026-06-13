import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { SpeechRequest } from "../adapters/speech-request";
import type { SpeechResponse } from "../adapters/speech-response";
import type { SpeechToTextAdapter } from "../adapters/speech-to-text-adapter";
import type { TextToSpeechAdapter } from "../adapters/text-to-speech-adapter";

interface DesktopSpeechBridge {
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

function speechBridge(): DesktopSpeechBridge | undefined {
  const global = globalThis as { jarvis?: DesktopSpeechBridge };
  if (typeof global.jarvis === "undefined") {
    return undefined;
  }
  const bridge = global.jarvis;
  if (
    bridge &&
    typeof bridge.speechTranscribe === "function" &&
    typeof bridge.speechSpeak === "function"
  ) {
    return bridge;
  }
  return undefined;
}

/** Renderer STT via Electron main process (Groq Whisper). */
export class DesktopIpcSpeechToTextAdapter implements SpeechToTextAdapter {
  readonly adapterId = "desktop-ipc-stt";

  async transcribe(
    request: SpeechRequest,
    _config: SpeechProviderConfig,
  ): Promise<SpeechResponse> {
    const bridge = speechBridge();
    if (!bridge || !request.audioBase64) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: "groq",
        stub: true,
        output: request.text ?? "",
        createdAt: new Date().toISOString(),
        error: {
          code: "SPEECH_IPC_UNAVAILABLE",
          message: "Desktop speech IPC is not available",
        },
      };
    }
    return bridge.speechTranscribe({
      audioBase64: request.audioBase64,
      mimeType: request.mimeType,
      requestId: request.requestId,
    });
  }
}

/** Renderer TTS via Electron main process (Edge TTS). */
export class DesktopIpcTextToSpeechAdapter implements TextToSpeechAdapter {
  readonly adapterId = "desktop-ipc-tts";

  async synthesize(
    request: SpeechRequest,
    _config: SpeechProviderConfig,
  ): Promise<SpeechResponse> {
    const bridge = speechBridge();
    if (!bridge) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: "edge-tts",
        stub: true,
        output: request.text,
        createdAt: new Date().toISOString(),
        error: {
          code: "SPEECH_IPC_UNAVAILABLE",
          message: "Desktop speech IPC is not available",
        },
      };
    }
    return bridge.speechSpeak({
      text: request.text,
      requestId: request.requestId,
    });
  }
}

export function hasDesktopSpeechBridge(): boolean {
  return speechBridge() !== undefined;
}

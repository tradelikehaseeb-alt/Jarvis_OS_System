import type { SpeechResponse } from "../adapters/speech-response";

import { createDefaultTtsProviderRuntime, type TtsProviderRuntime } from "./tts-provider-runtime";
import { naturalWordDelayMs } from "./speech-timing";

export interface VoicePlaybackChunk {
  readonly text: string;
  readonly audioBase64?: string;
  readonly mimeType?: string;
}

export interface VoicePlaybackControllerOptions {
  readonly ttsRuntime?: TtsProviderRuntime;
  readonly onChunk?: (chunk: VoicePlaybackChunk) => void;
  readonly onComplete?: () => void;
}

/**
 * Interruptible voice playback controller for streaming TTS (Phase 91).
 */
export class VoicePlaybackController {
  private readonly ttsRuntime: TtsProviderRuntime;
  private readonly onChunk?: (chunk: VoicePlaybackChunk) => void;
  private readonly onComplete?: () => void;
  private abortController: AbortController | null = null;
  private speaking = false;

  constructor(options: VoicePlaybackControllerOptions = {}) {
    this.ttsRuntime = options.ttsRuntime ?? createDefaultTtsProviderRuntime();
    this.onChunk = options.onChunk;
    this.onComplete = options.onComplete;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  interrupt(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.speaking = false;
  }

  async speak(requestId: string, text: string): Promise<SpeechResponse> {
    this.interrupt();
    const controller = new AbortController();
    this.abortController = controller;
    this.speaking = true;

    const response = await this.ttsRuntime.synthesize({
      requestId,
      text,
    });

    if (controller.signal.aborted) {
      this.speaking = false;
      return response;
    }

    const words = text.split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (controller.signal.aborted) {
        break;
      }
      this.onChunk?.({
        text: `${word} `,
        audioBase64: response.audioBase64,
        mimeType: response.mimeType,
      });
      await new Promise((resolve) => setTimeout(resolve, naturalWordDelayMs(word)));
    }

    this.speaking = false;
    this.abortController = null;
    this.onComplete?.();
    return response;
  }
}

export function createDefaultVoicePlaybackController(
  options?: VoicePlaybackControllerOptions,
): VoicePlaybackController {
  return new VoicePlaybackController(options);
}

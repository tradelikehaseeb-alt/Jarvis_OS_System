import type { SpeechResponse } from "../adapters/speech-response";
import { defaultTtsSpeechQueue } from "../adapters/internal/tts-speech-queue";
import { stripMarkdownForSpeech } from "../adapters/internal/markdown-strip";

import { createDefaultTtsProviderRuntime, type TtsProviderRuntime } from "./tts-provider-runtime";
import { naturalWordDelayMs } from "./speech-timing";
import { isJarvisRendererBuild } from "./environment";

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
    defaultTtsSpeechQueue.cancelAll();
  }

  async speak(requestId: string, text: string): Promise<SpeechResponse> {
    this.interrupt();
    const controller = new AbortController();
    this.abortController = controller;
    this.speaking = true;

    let response: SpeechResponse;
    try {
      response = await this.ttsRuntime.synthesize({
        requestId,
        text: stripMarkdownForSpeech(text),
      });
    } catch (error) {
      if (error instanceof Error && error.message === "TTS_CANCELLED") {
        this.speaking = false;
        this.abortController = null;
        return {
          requestId,
          adapterId: "voice-playback",
          providerId: "jarvis-tts",
          stub: false,
          output: text,
          createdAt: new Date().toISOString(),
        };
      }
      throw error;
    }

    if (controller.signal.aborted) {
      this.speaking = false;
      return response;
    }

    if (response.audioBase64 && isJarvisRendererBuild()) {
      type BrowserAudio = {
        onended: (() => void) | null;
        onerror: (() => void) | null;
        pause: () => void;
        play: () => Promise<void>;
      };
      const AudioCtor = (
        globalThis as { Audio?: new (src: string) => BrowserAudio }
      ).Audio;
      if (AudioCtor) {
        const audio = new AudioCtor(
          `data:${response.mimeType ?? "audio/mpeg"};base64,${response.audioBase64}`,
        );
        const abortListener = () => {
          audio.pause();
        };
        controller.signal.addEventListener("abort", abortListener, { once: true });
        try {
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error("TTS audio playback failed"));
            void audio.play().catch(reject);
          });
        } catch (error) {
          if (!(error instanceof Error) || error.message !== "TTS audio playback failed") {
            throw error;
          }
        } finally {
          controller.signal.removeEventListener("abort", abortListener);
        }
        this.onChunk?.({
          text,
          audioBase64: response.audioBase64,
          mimeType: response.mimeType,
        });
        this.speaking = false;
        this.abortController = null;
        this.onComplete?.();
        return response;
      }
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

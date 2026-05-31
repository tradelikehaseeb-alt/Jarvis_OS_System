import { useSpeechStubComponents } from "../internal/speech-component-policy";

import { synthesizeWithEdgeTts } from "./internal/edge-tts-synthesis";
import { stripMarkdownForSpeech } from "./internal/markdown-strip";
import { synthesizeWithPyttsx3 } from "./internal/pyttsx3-local-tts";
import { readJarvisSpeechEnvConfig } from "./internal/speech-env-config";
import { defaultTtsSpeechQueue } from "./internal/tts-speech-queue";
import { StubTextToSpeechAdapterLegacy } from "./stub-text-to-speech-adapter-legacy";
import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { TextToSpeechAdapter } from "./text-to-speech-adapter";

function providerError(
  request: SpeechRequest,
  adapterId: string,
  providerId: string,
  code: string,
  message: string,
  started: number,
): SpeechResponse {
  return {
    requestId: request.requestId,
    adapterId,
    providerId,
    stub: false,
    output: request.text,
    latencyMs: Date.now() - started,
    createdAt: new Date().toISOString(),
    error: { code, message },
  };
}

/**
 * Production Jarvis TTS — Edge TTS primary, pyttsx3 offline fallback.
 */
export class StubTextToSpeechAdapter implements TextToSpeechAdapter {
  readonly adapterId = "stub-text-to-speech-adapter";
  private readonly legacy = new StubTextToSpeechAdapterLegacy();
  private readonly queue = defaultTtsSpeechQueue;

  async synthesize(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    if (useSpeechStubComponents()) {
      return this.legacy.synthesize(request, config);
    }

    return this.queue.enqueue(() => this.synthesizeLive(request, config));
  }

  cancelSpeech(): void {
    this.queue.cancelAll();
  }

  private async synthesizeLive(
    request: SpeechRequest,
    config: SpeechProviderConfig,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    const env = readJarvisSpeechEnvConfig();
    const providerId =
      config.providerId === "speech-stub" ? "jarvis-tts" : config.providerId;
    const spokenText = stripMarkdownForSpeech(request.text);

    if (spokenText.length === 0) {
      return providerError(
        request,
        this.adapterId,
        providerId,
        "TTS_PROVIDER_ERROR",
        "TTS text is required",
        started,
      );
    }

    const useEdge = env.ttsProvider === "edge-tts" || env.ttsProvider === "edge";

    if (useEdge) {
      try {
        const audio = await synthesizeWithEdgeTts({
          text: spokenText,
          voice: env.ttsVoice,
          rate: env.ttsSpeed,
          volume: env.ttsVolume,
        });
        return {
          requestId: request.requestId,
          adapterId: this.adapterId,
          providerId: "edge-tts",
          stub: false,
          output: spokenText,
          audioBase64: audio.toString("base64"),
          mimeType: "audio/mpeg",
          latencyMs: Date.now() - started,
          createdAt: new Date().toISOString(),
        };
      } catch {
        // fall through to pyttsx3
      }
    }

    try {
      const offline = await synthesizeWithPyttsx3({
        text: spokenText,
        pythonCommand: env.pythonCommand,
      });
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: "pyttsx3-local",
        stub: false,
        output: spokenText,
        audioBase64: offline.audio.toString("base64"),
        mimeType: offline.mimeType,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return providerError(
        request,
        this.adapterId,
        providerId,
        "TTS_PROVIDER_ERROR",
        error instanceof Error ? error.message : "TTS synthesis failed",
        started,
      );
    }
  }
}

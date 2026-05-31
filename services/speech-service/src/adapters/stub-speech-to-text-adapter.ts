import { useSpeechStubComponents } from "../internal/speech-component-policy";

import { isAudioTooShort } from "./internal/audio-duration";
import { transcribeWithFasterWhisperLocal } from "./internal/faster-whisper-local-stt";
import { transcribeWithGroqWhisper } from "./internal/groq-whisper-client";
import { readJarvisSpeechEnvConfig } from "./internal/speech-env-config";
import { detectWakeWordInTranscript } from "./internal/wake-word-transcript";
import { StubSpeechToTextAdapterLegacy } from "./stub-speech-to-text-adapter-legacy";
import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { SpeechToTextAdapter } from "./speech-to-text-adapter";

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
    output: "",
    confidence: 0,
    latencyMs: Date.now() - started,
    createdAt: new Date().toISOString(),
    error: { code, message },
  };
}

function successResponse(
  request: SpeechRequest,
  adapterId: string,
  providerId: string,
  text: string,
  confidence: number,
  isWakeWord: boolean,
  started: number,
): SpeechResponse {
  return {
    requestId: request.requestId,
    adapterId,
    providerId,
    stub: false,
    output: text,
    confidence,
    isWakeWord,
    latencyMs: Date.now() - started,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Production Jarvis STT — Groq Whisper primary, faster-whisper local fallback.
 */
export class StubSpeechToTextAdapter implements SpeechToTextAdapter {
  readonly adapterId = "stub-speech-to-text-adapter";
  private readonly legacy = new StubSpeechToTextAdapterLegacy();

  async transcribe(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    if (useSpeechStubComponents()) {
      return this.legacy.transcribe(request, config);
    }

    const started = Date.now();
    const env = readJarvisSpeechEnvConfig();
    const providerId = config.providerId === "speech-stub" ? "jarvis-stt" : config.providerId;

    const audioBase64 = request.audioBase64?.trim();
    if (!audioBase64) {
      const hint = request.text.trim();
      if (hint.length === 0) {
        return providerError(
          request,
          this.adapterId,
          providerId,
          "STT_PROVIDER_ERROR",
          "STT_PROVIDER_ERROR: audio payload is required",
          started,
        );
      }
      const wake = detectWakeWordInTranscript(hint);
      return successResponse(
        request,
        this.adapterId,
        providerId,
        wake.text,
        wake.confidence,
        wake.isWakeWord,
        started,
      );
    }

    const audio = Buffer.from(audioBase64, "base64");
    const mimeType = request.mimeType ?? "audio/webm";

    if (isAudioTooShort(audio, mimeType)) {
      return providerError(
        request,
        this.adapterId,
        providerId,
        "AUDIO_TOO_SHORT",
        "AUDIO_TOO_SHORT: audio clip is shorter than 0.5 seconds",
        started,
      );
    }

    const useGroq =
      env.sttProvider === "groq" && Boolean(env.groqApiKey);
    const useLocalFallback = env.sttFallback === "local";

    if (useGroq) {
      try {
        const groq = await transcribeWithGroqWhisper({
          apiKey: env.groqApiKey!,
          audio,
          mimeType,
        });
        const wake = detectWakeWordInTranscript(groq.text);
        return successResponse(
          request,
          this.adapterId,
          "groq-whisper",
          wake.text,
          wake.confidence,
          wake.isWakeWord,
          started,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("NO_SPEECH_DETECTED")) {
          return providerError(
            request,
            this.adapterId,
            "groq-whisper",
            "NO_SPEECH_DETECTED",
            "NO_SPEECH_DETECTED",
            started,
          );
        }
        if (!useLocalFallback) {
          return providerError(
            request,
            this.adapterId,
            "groq-whisper",
            "STT_PROVIDER_ERROR",
            message,
            started,
          );
        }
      }
    }

    if (useLocalFallback) {
      try {
        const local = await transcribeWithFasterWhisperLocal({
          audio,
          mimeType,
          pythonCommand: env.pythonCommand,
        });
        const wake = detectWakeWordInTranscript(local.text);
        return successResponse(
          request,
          this.adapterId,
          "faster-whisper-local",
          wake.text,
          wake.confidence,
          wake.isWakeWord,
          started,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = message.includes("NO_SPEECH_DETECTED")
          ? "NO_SPEECH_DETECTED"
          : "STT_PROVIDER_ERROR";
        return providerError(
          request,
          this.adapterId,
          "faster-whisper-local",
          code,
          message,
          started,
        );
      }
    }

    return providerError(
      request,
      this.adapterId,
      providerId,
      "STT_KEY_MISSING",
      "STT_KEY_MISSING: Set GROQ_API_KEY or enable JARVIS_STT_FALLBACK=local",
      started,
    );
  }
}

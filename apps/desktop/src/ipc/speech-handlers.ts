import { ipcMain } from "electron";

import {
  detectWakeWordInTranscript,
  isAudioBufferTooSmall,
  isGroqSttFailureRetryable,
  readJarvisSpeechEnvConfig,
  speechDebug,
  synthesizeSpeechForIpc,
  transcribeSpeechForIpc,
} from "@jarvis/speech-service";

import type {
  SpeechInitStatus,
  SpeechIpcResponse,
  SpeechSpeakRequest,
  SpeechTranscribeRequest,
} from "./speech-types";
import { getSpeechPlaybackRuntime } from "./speech-playback-runtime";

let speechReady = false;

function buildInitStatus(): SpeechInitStatus {
  const config = readJarvisSpeechEnvConfig(process.env);
  const groqConfigured = Boolean(config.groqApiKey);
  const deepgramConfigured = Boolean(config.deepgramApiKey);
  const elevenConfigured = Boolean(config.elevenlabsApiKey);
  speechReady = groqConfigured || deepgramConfigured;

  const sttEngine = groqConfigured
    ? deepgramConfigured
      ? "Groq Whisper ✅ (Deepgram + local fallback)"
      : "Groq Whisper ✅ (local fallback)"
    : deepgramConfigured
      ? "Deepgram ✅"
      : config.sttFallback === "local"
        ? "Local faster-whisper ✅"
        : "STT (missing API key)";

  const ttsEngine =
    config.ttsProvider === "elevenlabs" && elevenConfigured
      ? "ElevenLabs ✅"
      : elevenConfigured
        ? `Edge TTS ✅ (ElevenLabs fallback)`
        : "Edge TTS ✅";

  return {
    ready: speechReady,
    sttEngine,
    ttsEngine,
    ttsVoice: config.ttsVoice,
    groqConfigured,
    message: speechReady
      ? "Speech engines ready in main process"
      : "Set GROQ_API_KEY or DEEPGRAM_API_KEY in .env for STT",
  };
}

function errorResponse(
  requestId: string,
  adapterId: string,
  providerId: string,
  code: string,
  message: string,
  started: number,
): SpeechIpcResponse {
  return {
    requestId,
    adapterId,
    providerId,
    stub: false,
    output: "",
    createdAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    error: { code, message },
  };
}

/**
 * Main-process speech bridge — Groq Whisper STT with Deepgram fallback + Edge/ElevenLabs TTS.
 */
export function registerSpeechHandlers(): void {
  ipcMain.handle("speech:init", () => buildInitStatus());

  ipcMain.handle(
    "speech:transcribe",
    async (_event, request: SpeechTranscribeRequest): Promise<SpeechIpcResponse> => {
      const started = Date.now();
      const requestId = request.requestId ?? `stt-${Date.now()}`;
      const config = readJarvisSpeechEnvConfig(process.env);

      if (!config.groqApiKey && !config.deepgramApiKey) {
        return errorResponse(
          requestId,
          "speech-ipc-stt",
          "groq",
          "STT_KEY_MISSING",
          "Set GROQ_API_KEY or DEEPGRAM_API_KEY in .env",
          started,
        );
      }

      try {
        const audio = Buffer.from(request.audioBase64, "base64");
        if (isAudioBufferTooSmall(audio)) {
          speechDebug("STT skipped — audio buffer too small", { bytes: audio.length });
          return {
            requestId,
            adapterId: "speech-ipc-stt",
            providerId: "groq",
            stub: false,
            output: "",
            confidence: 0,
            latencyMs: Date.now() - started,
            createdAt: new Date().toISOString(),
            error: {
              code: "EMPTY_AUDIO_BUFFER",
              message: "Recorded audio was empty or too short — retry capture",
            },
          };
        }

        const result = await transcribeSpeechForIpc(
          process.env,
          audio,
          request.mimeType ?? "audio/webm",
        );
        const wake = detectWakeWordInTranscript(result.text);
        return {
          requestId,
          adapterId: "speech-ipc-stt",
          providerId: result.providerId,
          stub: false,
          output: result.text,
          confidence: result.confidence,
          latencyMs: Date.now() - started,
          createdAt: new Date().toISOString(),
          isWakeWord: wake.isWakeWord,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "STT failed";
        if (message.includes("NO_SPEECH_DETECTED")) {
          speechDebug("STT no speech detected");
          return {
            requestId,
            adapterId: "speech-ipc-stt",
            providerId: "groq",
            stub: false,
            output: "",
            confidence: 0,
            latencyMs: Date.now() - started,
            createdAt: new Date().toISOString(),
            error: {
              code: "NO_SPEECH_DETECTED",
              message: "No speech detected in recording",
            },
          };
        }

        if (isGroqSttFailureRetryable(message)) {
          speechDebug("STT primary failed — retrying resilient fallback chain", {
            error: message,
          });
          try {
            const audio = Buffer.from(request.audioBase64, "base64");
            const retry = await transcribeSpeechForIpc(
              process.env,
              audio,
              request.mimeType ?? "audio/webm",
              { skipGroq: true },
            );
            const wake = detectWakeWordInTranscript(retry.text);
            return {
              requestId,
              adapterId: "speech-ipc-stt",
              providerId: retry.providerId,
              stub: false,
              output: retry.text,
              confidence: retry.confidence,
              latencyMs: Date.now() - started,
              createdAt: new Date().toISOString(),
              isWakeWord: wake.isWakeWord,
            };
          } catch (retryError) {
            const retryMessage =
              retryError instanceof Error ? retryError.message : "STT fallback failed";
            speechDebug("STT resilient fallback exhausted", { error: retryMessage });
          }
        }

        return errorResponse(
          requestId,
          "speech-ipc-stt",
          "groq",
          "STT_FAILED",
          message,
          started,
        );
      }
    },
  );

  ipcMain.handle(
    "speech:speak",
    async (event, request: SpeechSpeakRequest): Promise<SpeechIpcResponse> => {
      const started = Date.now();
      const requestId = request.requestId ?? `tts-${Date.now()}`;
      const config = readJarvisSpeechEnvConfig(process.env);
      const voice = request.voice ?? config.ttsVoice;

      try {
        const result = await synthesizeSpeechForIpc(process.env, request.text, voice);
        const audioBase64 = result.audio.toString("base64");

        getSpeechPlaybackRuntime().streamPlayback(
          {
            requestId,
            audioBase64,
            mimeType: result.mimeType,
            providerId: result.providerId,
          },
          event.sender,
        );

        return {
          requestId,
          adapterId: "speech-ipc-tts",
          providerId: result.providerId,
          stub: false,
          output: request.text,
          audioBase64,
          mimeType: result.mimeType,
          latencyMs: Date.now() - started,
          createdAt: new Date().toISOString(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "TTS failed";
        return errorResponse(
          requestId,
          "speech-ipc-tts",
          "edge-tts",
          "TTS_FAILED",
          message,
          started,
        );
      }
    },
  );
}

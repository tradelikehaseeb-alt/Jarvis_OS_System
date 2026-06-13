import { readEnvApiKey } from "./read-env-api-key";
import { readJarvisSpeechEnvConfig } from "./speech-env-config";
import { synthesizeWithEdgeTts } from "./edge-tts-synthesis";
import { synthesizeWithElevenLabs } from "./elevenlabs-tts-synthesis";
import { transcribeWithDeepgram } from "./deepgram-stt-client";
import { transcribeWithFasterWhisperLocal } from "./faster-whisper-local-stt";
import { transcribeWithGroqWhisper } from "./groq-whisper-client";

export interface SpeechIpcSttResult {
  readonly text: string;
  readonly confidence: number;
  readonly providerId: "groq" | "deepgram" | "local";
}

export interface SpeechIpcTtsResult {
  readonly audio: Buffer;
  readonly providerId: "edge-tts" | "elevenlabs";
  readonly mimeType: string;
}

const MIN_AUDIO_BYTES = 512;

export function speechDebug(
  message: string,
  detail?: Readonly<Record<string, unknown>>,
): void {
  if (detail && Object.keys(detail).length > 0) {
    console.info(`[speech-debug] ${message}`, detail);
  } else {
    console.info(`[speech-debug] ${message}`);
  }
}

export function isAudioBufferTooSmall(audio: Buffer): boolean {
  return audio.length < MIN_AUDIO_BYTES;
}

export function isGroqSttFailureRetryable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("groq whisper failed") ||
    lower.includes("timeout") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("aborted") ||
    lower.includes("connection error") ||
    lower.includes("econnrefused") ||
    lower.includes("authentication") ||
    lower.includes("auth exhaustion") ||
    lower.includes("quota") ||
    lower.includes("exhausted")
  );
}

export interface TranscribeSpeechForIpcOptions {
  /** Skip Groq and use Deepgram/local fallbacks only. */
  readonly skipGroq?: boolean;
}

async function transcribeWithLocalFallback(
  env: NodeJS.ProcessEnv,
  audio: Buffer,
  mimeType: string,
): Promise<SpeechIpcSttResult> {
  const config = readJarvisSpeechEnvConfig(env);
  const local = await transcribeWithFasterWhisperLocal({
    audio,
    mimeType,
    pythonCommand: config.pythonCommand,
  });
  speechDebug("STT local faster-whisper success", { chars: local.text.length });
  return {
    text: local.text,
    confidence: local.confidence,
    providerId: "local",
  };
}

export async function transcribeSpeechForIpc(
  env: NodeJS.ProcessEnv,
  audio: Buffer,
  mimeType: string,
  options: TranscribeSpeechForIpcOptions = {},
): Promise<SpeechIpcSttResult> {
  const config = readJarvisSpeechEnvConfig(env);
  const groqKey = config.groqApiKey;
  const deepgramKey = readEnvApiKey(["DEEPGRAM_API_KEY", "JARVIS_DEEPGRAM_API_KEY"], env);
  const useLocalFallback = config.sttFallback === "local";

  if (!groqKey && !deepgramKey && !useLocalFallback) {
    throw new Error("No STT provider configured (GROQ_API_KEY, DEEPGRAM_API_KEY, or local)");
  }

  speechDebug("STT Triggered", {
    bytes: audio.length,
    mimeType,
    groq: Boolean(groqKey),
    deepgram: Boolean(deepgramKey),
    local: useLocalFallback,
    skipGroq: Boolean(options.skipGroq),
  });

  if (groqKey && !options.skipGroq) {
    try {
      const result = await transcribeWithGroqWhisper({
        apiKey: groqKey,
        audio,
        mimeType,
      });
      speechDebug("STT Groq success", { chars: result.text.length });
      return { text: result.text, confidence: result.confidence, providerId: "groq" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("NO_SPEECH_DETECTED")) {
        throw error;
      }
      if (!isGroqSttFailureRetryable(message)) {
        throw error;
      }
      speechDebug("STT Groq failed — trying alternate providers", { error: message });
    }
  }

  if (deepgramKey) {
    try {
      const deepgram = await transcribeWithDeepgram({
        apiKey: deepgramKey,
        audio,
        mimeType,
      });
      speechDebug("STT Deepgram success", { chars: deepgram.text.length });
      return {
        text: deepgram.text,
        confidence: deepgram.confidence,
        providerId: "deepgram",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("NO_SPEECH_DETECTED")) {
        throw error;
      }
      speechDebug("STT Deepgram failed", { error: message });
      if (!useLocalFallback) {
        throw error;
      }
    }
  }

  if (useLocalFallback) {
    return transcribeWithLocalFallback(env, audio, mimeType);
  }

  throw new Error("GROQ_API_KEY STT failed and no alternate STT provider is configured");
}

export async function synthesizeSpeechForIpc(
  env: NodeJS.ProcessEnv,
  text: string,
  voice?: string,
): Promise<SpeechIpcTtsResult> {
  const config = readJarvisSpeechEnvConfig(env);
  const elevenKey = readEnvApiKey(["ELEVENLABS_API_KEY", "JARVIS_ELEVENLABS_API_KEY"], env);
  const trimmed = text.trim();
  const providers: Array<"elevenlabs" | "edge-tts"> = [];

  if (config.ttsProvider === "elevenlabs" && elevenKey) {
    providers.push("elevenlabs");
  } else if (config.ttsProvider === "edge-tts" || config.ttsProvider === "edge") {
    providers.push("edge-tts");
    if (elevenKey) {
      providers.push("elevenlabs");
    }
  } else if (elevenKey) {
    providers.push("elevenlabs");
    providers.push("edge-tts");
  } else {
    providers.push("edge-tts");
  }

  speechDebug("TTS synthesis requested", {
    providerChain: providers,
    chars: trimmed.length,
  });

  let lastError: Error | undefined;
  for (const providerId of providers) {
    try {
      if (providerId === "elevenlabs" && elevenKey) {
        const audio = await synthesizeWithElevenLabs({
          apiKey: elevenKey,
          text: trimmed,
          voiceId: voice?.trim() || undefined,
        });
        speechDebug("TTS Stream Playing", { providerId, bytes: audio.length });
        return { audio, providerId, mimeType: "audio/mpeg" };
      }

      const audio = await synthesizeWithEdgeTts({
        text: trimmed,
        voice: voice ?? config.ttsVoice,
        rate: config.ttsSpeed,
        volume: config.ttsVolume,
      });
      speechDebug("TTS Stream Playing", { providerId: "edge-tts", bytes: audio.length });
      return { audio, providerId: "edge-tts", mimeType: "audio/mpeg" };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      speechDebug("TTS provider failed", {
        providerId,
        error: lastError.message,
      });
    }
  }

  throw lastError ?? new Error("TTS failed");
}

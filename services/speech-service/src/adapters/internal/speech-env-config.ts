import { readEnvApiKey } from "./read-env-api-key";

const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";
const GROQ_STT_TIMEOUT_MS = 15_000;

export interface JarvisSpeechEnvConfig {
  readonly sttProvider: string;
  readonly sttFallback: string;
  readonly ttsProvider: string;
  readonly ttsVoice: string;
  readonly ttsSpeed: string;
  readonly ttsVolume: string;
  readonly groqApiKey?: string;
  readonly deepgramApiKey?: string;
  readonly elevenlabsApiKey?: string;
  readonly pythonCommand: string;
}

export function readJarvisSpeechEnvConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): JarvisSpeechEnvConfig {
  return {
    sttProvider: env.JARVIS_STT_PROVIDER?.trim() || "groq",
    sttFallback: env.JARVIS_STT_FALLBACK?.trim() || "local",
    ttsProvider: env.JARVIS_TTS_PROVIDER?.trim() || "edge-tts",
    ttsVoice: env.JARVIS_TTS_VOICE?.trim() || "en-US-GuyNeural",
    ttsSpeed: env.JARVIS_TTS_SPEED?.trim() || "+0%",
    ttsVolume: env.JARVIS_TTS_VOLUME?.trim() || "+0%",
    groqApiKey: readEnvApiKey(["GROQ_API_KEY", "JARVIS_GROQ_API_KEY"], env),
    deepgramApiKey: readEnvApiKey(["DEEPGRAM_API_KEY", "JARVIS_DEEPGRAM_API_KEY"], env),
    elevenlabsApiKey: readEnvApiKey(["ELEVENLABS_API_KEY", "JARVIS_ELEVENLABS_API_KEY"], env),
    pythonCommand: env.JARVIS_PYTHON?.trim() || env.HERMES_PYTHON?.trim() || "py -3.11",
  };
}

export const GROQ_WHISPER_STT = {
  url: GROQ_WHISPER_URL,
  model: GROQ_WHISPER_MODEL,
  timeoutMs: GROQ_STT_TIMEOUT_MS,
} as const;

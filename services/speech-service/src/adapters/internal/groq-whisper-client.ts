import { GROQ_WHISPER_STT } from "./speech-env-config";

export interface GroqWhisperTranscription {
  readonly text: string;
  readonly confidence: number;
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("wav")) {
    return "wav";
  }
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
    return "mp3";
  }
  return "webm";
}

/**
 * Groq OpenAI-compatible Whisper transcription (auto language, 15s timeout).
 */
export async function transcribeWithGroqWhisper(options: {
  readonly apiKey: string;
  readonly audio: Buffer;
  readonly mimeType?: string;
  readonly model?: string;
}): Promise<GroqWhisperTranscription> {
  const mimeType = options.mimeType ?? "audio/webm";
  const extension = extensionForMime(mimeType);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([options.audio], { type: mimeType }),
    `audio.${extension}`,
  );
  formData.append("model", options.model ?? GROQ_WHISPER_STT.model);
  formData.append("response_format", "json");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_WHISPER_STT.timeoutMs);
  try {
    const response = await fetch(GROQ_WHISPER_STT.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${options.apiKey}` },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`Groq Whisper failed: ${response.status} ${detail}`);
    }

    const payload = (await response.json()) as { text?: string };
    const text = payload.text?.trim() ?? "";
    if (text.length === 0) {
      throw new Error("NO_SPEECH_DETECTED");
    }
    return { text, confidence: 0.9 };
  } finally {
    clearTimeout(timer);
  }
}

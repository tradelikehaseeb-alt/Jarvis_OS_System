const DEEPGRAM_LISTEN_URL = "https://api.deepgram.com/v1/listen";
const DEEPGRAM_MODEL = "nova-2";
const DEEPGRAM_TIMEOUT_MS = 20_000;

export interface DeepgramTranscription {
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
 * Deepgram prerecorded STT — binary upload (used when Groq Whisper is rate-limited).
 */
export async function transcribeWithDeepgram(options: {
  readonly apiKey: string;
  readonly audio: Buffer;
  readonly mimeType?: string;
  readonly model?: string;
}): Promise<DeepgramTranscription> {
  const mimeType = options.mimeType ?? "audio/webm";
  const model = options.model ?? DEEPGRAM_MODEL;
  const url = `${DEEPGRAM_LISTEN_URL}?model=${encodeURIComponent(model)}&smart_format=true&punctuate=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEEPGRAM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${options.apiKey}`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(options.audio),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`Deepgram STT failed: ${response.status} ${detail}`);
    }

    const payload = (await response.json()) as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{ transcript?: string; confidence?: number }>;
        }>;
      };
    };
    const alternative = payload.results?.channels?.[0]?.alternatives?.[0];
    const text = alternative?.transcript?.trim() ?? "";
    if (text.length === 0) {
      throw new Error("NO_SPEECH_DETECTED");
    }
    return {
      text,
      confidence: alternative?.confidence ?? 0.88,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function isDeepgramSttRetryableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("groq whisper failed") ||
    lower.includes("stt_failed") ||
    lower.includes("timeout") ||
    lower.includes("503") ||
    lower.includes("502")
  );
}

export { extensionForMime as deepgramExtensionForMime };

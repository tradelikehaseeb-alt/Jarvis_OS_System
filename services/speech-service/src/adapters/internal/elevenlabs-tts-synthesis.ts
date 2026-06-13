const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const DEFAULT_ELEVENLABS_MODEL = "eleven_multilingual_v2";
const DEFAULT_ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJgB";
const ELEVENLABS_TIMEOUT_MS = 25_000;

/**
 * ElevenLabs streaming-quality TTS — returns MP3 buffer for IPC playback.
 */
export async function synthesizeWithElevenLabs(options: {
  readonly apiKey: string;
  readonly text: string;
  readonly voiceId?: string;
  readonly modelId?: string;
}): Promise<Buffer> {
  const text = options.text.trim();
  if (text.length === 0) {
    throw new Error("ElevenLabs TTS text is required");
  }

  const voiceId = options.voiceId?.trim() || DEFAULT_ELEVENLABS_VOICE_ID;
  const modelId = options.modelId?.trim() || DEFAULT_ELEVENLABS_MODEL;
  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(voiceId)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": options.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${detail}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error("ElevenLabs TTS returned empty audio");
    }
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

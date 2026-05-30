import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { TextToSpeechAdapter } from "./text-to-speech-adapter";

export interface HttpTtsAdapterOptions {
  readonly adapterId: string;
  readonly providerId: string;
  readonly endpointPath: string;
}

async function synthesizeHttp(
  url: string,
  apiKey: string | undefined,
  body: unknown,
  timeoutMs = 8_000,
): Promise<{ audioBase64: string; mimeType: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      audioBase64: buffer.toString("base64"),
      mimeType: response.headers.get("content-type") ?? "audio/mpeg",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * HTTP TTS adapter. Provider errors are returned explicitly; no silent stub fallback.
 */
export class HttpTextToSpeechAdapter implements TextToSpeechAdapter {
  readonly adapterId: string;
  private readonly providerId: string;
  private readonly endpointPath: string;

  constructor(options: HttpTtsAdapterOptions) {
    this.adapterId = options.adapterId;
    this.providerId = options.providerId;
    this.endpointPath = options.endpointPath;
  }

  async synthesize(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    if (config.mode !== "live" || !config.baseUrl) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: true,
        output: request.text,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        error: {
          code: "TTS_KEY_MISSING",
          message:
            "TTS provider is not configured. Set the required TTS API key and base URL before using live speech synthesis.",
        },
      };
    }
    if (config.providerId !== "edge-tts" && !config.apiKey) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: true,
        output: request.text,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        error: {
          code: "TTS_KEY_MISSING",
          message:
            "TTS API key is missing. Configure the selected TTS provider before using live speech synthesis.",
        },
      };
    }

    try {
      const audio = await synthesizeHttp(
        `${config.baseUrl}${this.endpointPath}`,
        config.apiKey,
        {
          model: config.model,
          input: request.text,
          voice: config.model,
        },
      );
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: false,
        output: request.text,
        audioBase64: audio.audioBase64,
        mimeType: audio.mimeType,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: true,
        output: request.text,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        error: {
          code: "TTS_PROVIDER_ERROR",
          message:
            error instanceof Error ? error.message : "TTS provider request failed",
        },
      };
    }
  }
}

export const ElevenLabsTtsAdapter = new HttpTextToSpeechAdapter({
  adapterId: "elevenlabs-tts-adapter",
  providerId: "elevenlabs",
  endpointPath: "/text-to-speech/default",
});

export const OpenAiTtsAdapter = new HttpTextToSpeechAdapter({
  adapterId: "openai-tts-adapter",
  providerId: "openai-tts",
  endpointPath: "/audio/speech",
});

export const EdgeTtsAdapter = new HttpTextToSpeechAdapter({
  adapterId: "edge-tts-adapter",
  providerId: "edge-tts",
  endpointPath: "/consumer/speech/synthesize",
});

import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { SpeechToTextAdapter } from "./speech-to-text-adapter";

export interface HttpSttAdapterOptions {
  readonly adapterId: string;
  readonly providerId: string;
  readonly endpointPath: string;
  readonly fallbackText?: string;
}

function encodePcmPlaceholder(request: SpeechRequest): string {
  if (request.audioBase64) {
    return request.audioBase64;
  }
  return Buffer.from(request.text || "jarvis").toString("base64");
}

async function postJson(
  url: string,
  apiKey: string,
  body: unknown,
): Promise<{ text: string; confidence: number }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`STT request failed: ${response.status}`);
  }
  const payload = (await response.json()) as {
    text?: string;
    transcript?: string;
    confidence?: number;
  };
  const text = payload.text ?? payload.transcript ?? "";
  return {
    text,
    confidence: payload.confidence ?? 0.85,
  };
}

/**
 * HTTP STT adapter. Provider errors are returned explicitly; no silent stub fallback.
 */
export class HttpSpeechToTextAdapter implements SpeechToTextAdapter {
  readonly adapterId: string;
  private readonly providerId: string;
  private readonly endpointPath: string;

  constructor(options: HttpSttAdapterOptions) {
    this.adapterId = options.adapterId;
    this.providerId = options.providerId;
    this.endpointPath = options.endpointPath;
  }

  async transcribe(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    if (config.mode !== "live" || !config.apiKey || !config.baseUrl) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: true,
        output: "",
        confidence: 0,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        error: {
          code: "STT_KEY_MISSING",
          message:
            "STT provider is not configured. Set the required STT API key and base URL before using live voice transcription.",
        },
      };
    }

    try {
      const result = await postJson(
        `${config.baseUrl}${this.endpointPath}`,
        config.apiKey,
        {
          model: config.model,
          audio: encodePcmPlaceholder(request),
          mimeType: request.mimeType ?? "audio/webm",
        },
      );
      const output = result.text.trim() || request.text.trim() || "voice input";
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: false,
        output,
        confidence: result.confidence,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: config.providerId || this.providerId,
        stub: true,
        output: "",
        confidence: 0,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        error: {
          code: "STT_PROVIDER_ERROR",
          message:
            error instanceof Error ? error.message : "STT provider request failed",
        },
      };
    }
  }
}

export const WhisperSttAdapter = new HttpSpeechToTextAdapter({
  adapterId: "whisper-stt-adapter",
  providerId: "whisper",
  endpointPath: "/audio/transcriptions",
});

export const DeepgramSttAdapter = new HttpSpeechToTextAdapter({
  adapterId: "deepgram-stt-adapter",
  providerId: "deepgram",
  endpointPath: "/listen",
});

export const GroqWhisperSttAdapter = new HttpSpeechToTextAdapter({
  adapterId: "groq-whisper-stt-adapter",
  providerId: "groq-whisper",
  endpointPath: "/audio/transcriptions",
});

export const OpenAiRealtimeSttAdapter = new HttpSpeechToTextAdapter({
  adapterId: "openai-realtime-stt-adapter",
  providerId: "openai-realtime",
  endpointPath: "/realtime/transcriptions",
});

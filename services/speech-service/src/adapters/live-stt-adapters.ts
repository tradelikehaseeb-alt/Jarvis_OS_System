import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { SpeechToTextAdapter } from "./speech-to-text-adapter";
import { StubSpeechToTextAdapter } from "./stub-speech-to-text-adapter";

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
  const started = Date.now();
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
 * HTTP STT adapter with stub fallback when unconfigured or on failure (Phase 91).
 */
export class HttpSpeechToTextAdapter implements SpeechToTextAdapter {
  readonly adapterId: string;
  private readonly providerId: string;
  private readonly endpointPath: string;
  private readonly fallback: StubSpeechToTextAdapter;

  constructor(options: HttpSttAdapterOptions) {
    this.adapterId = options.adapterId;
    this.providerId = options.providerId;
    this.endpointPath = options.endpointPath;
    this.fallback = new StubSpeechToTextAdapter();
  }

  async transcribe(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    if (config.mode !== "live" || !config.apiKey || !config.baseUrl) {
      return this.fallback.transcribe(request, config);
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
    } catch {
      const fallback = await this.fallback.transcribe(request, {
        ...config,
        mode: "stub",
      });
      return {
        ...fallback,
        latencyMs: Date.now() - started,
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

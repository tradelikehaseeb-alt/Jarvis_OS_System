import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { SpeechToTextAdapter } from "./speech-to-text-adapter";
import { readEnvApiKey } from "../real-time/speech-provider-resolver";

export interface HttpSttAdapterOptions {
  readonly adapterId: string;
  readonly providerId: string;
  readonly endpointPath: string;
}

function encodePcmPlaceholder(request: SpeechRequest): string {
  if (request.audioBase64) {
    return request.audioBase64;
  }
  return Buffer.from(request.text || "jarvis").toString("base64");
}

function providerErrorResponse(
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
 * HTTP STT adapter (JSON body). Provider errors are fail-closed (stub=false).
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
      return providerErrorResponse(
        request,
        this.adapterId,
        config.providerId || this.providerId,
        "STT_KEY_MISSING",
        "STT provider is not configured. Set the required STT API key and base URL before using live voice transcription.",
        started,
      );
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
      const output = result.text.trim();
      if (output.length === 0) {
        return providerErrorResponse(
          request,
          this.adapterId,
          config.providerId || this.providerId,
          "STT_PROVIDER_ERROR",
          "STT provider returned empty transcript",
          started,
        );
      }
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
      return providerErrorResponse(
        request,
        this.adapterId,
        config.providerId || this.providerId,
        "STT_PROVIDER_ERROR",
        error instanceof Error ? error.message : "STT provider request failed",
        started,
      );
    }
  }
}

const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";

/**
 * Groq Whisper STT — multipart upload (fail-closed, no stub fallback).
 */
export class GroqWhisperSpeechToTextAdapter implements SpeechToTextAdapter {
  readonly adapterId = "groq-whisper-stt-adapter";

  async transcribe(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    const apiKey =
      config.apiKey ??
      readEnvApiKey(["GROQ_API_KEY", "JARVIS_GROQ_API_KEY"]);

    if (!apiKey) {
      return providerErrorResponse(
        request,
        this.adapterId,
        "groq-whisper",
        "STT_KEY_MISSING",
        "STT_KEY_MISSING: Set GROQ_API_KEY in .env",
        started,
      );
    }

    if (!request.audioBase64?.trim()) {
      return providerErrorResponse(
        request,
        this.adapterId,
        "groq-whisper",
        "STT_PROVIDER_ERROR",
        "STT_PROVIDER_ERROR: audio payload is required for Groq Whisper",
        started,
      );
    }

    try {
      const mimeType = request.mimeType ?? "audio/webm";
      const extension = mimeType.includes("wav")
        ? "wav"
        : mimeType.includes("mp3")
          ? "mp3"
          : "webm";
      const audioBytes = Buffer.from(request.audioBase64, "base64");
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([audioBytes], { type: mimeType }),
        `audio.${extension}`,
      );
      formData.append("model", config.model ?? GROQ_WHISPER_MODEL);
      formData.append("language", request.locale?.split("-")[0] ?? "en");
      formData.append("response_format", "json");

      const response = await fetch(GROQ_WHISPER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        return providerErrorResponse(
          request,
          this.adapterId,
          "groq-whisper",
          "STT_PROVIDER_ERROR",
          `STT_PROVIDER_ERROR: ${response.status} ${response.statusText}`,
          started,
        );
      }

      const payload = (await response.json()) as { text?: string };
      const output = payload.text?.trim() ?? "";
      if (output.length === 0) {
        return providerErrorResponse(
          request,
          this.adapterId,
          "groq-whisper",
          "STT_PROVIDER_ERROR",
          "STT_PROVIDER_ERROR: Groq Whisper returned empty transcript",
          started,
        );
      }

      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: "groq-whisper",
        stub: false,
        output,
        confidence: 0.9,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return providerErrorResponse(
        request,
        this.adapterId,
        "groq-whisper",
        "STT_PROVIDER_ERROR",
        error instanceof Error ? error.message : "STT_PROVIDER_ERROR: Groq Whisper failed",
        started,
      );
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

export const GroqWhisperSttAdapter = new GroqWhisperSpeechToTextAdapter();

export const OpenAiRealtimeSttAdapter = new HttpSpeechToTextAdapter({
  adapterId: "openai-realtime-stt-adapter",
  providerId: "openai-realtime",
  endpointPath: "/realtime/transcriptions",
});

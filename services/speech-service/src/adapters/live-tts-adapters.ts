import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "./speech-provider-config";
import type { SpeechRequest } from "./speech-request";
import type { SpeechResponse } from "./speech-response";
import type { TextToSpeechAdapter } from "./text-to-speech-adapter";
import { readEnvApiKey } from "../real-time/speech-provider-resolver";

export interface HttpTtsAdapterOptions {
  readonly adapterId: string;
  readonly providerId: string;
  readonly endpointPath: string;
}

const EDGE_TTS_VOICE = "en-US-JennyNeural";

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
    output: request.text,
    latencyMs: Date.now() - started,
    createdAt: new Date().toISOString(),
    error: { code, message },
  };
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

async function streamToBuffer(stream: AsyncIterable<Uint8Array | Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function edgeTtsSpeak(text: string, voice = EDGE_TTS_VOICE): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  try {
    return await streamToBuffer(audioStream);
  } finally {
    tts.close();
  }
}

/**
 * Edge TTS adapter — free, no API key (fail-closed on synthesis errors).
 */
export class EdgeTtsSpeechAdapter implements TextToSpeechAdapter {
  readonly adapterId = "edge-tts-adapter";

  async synthesize(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    const text = request.text.trim();
    if (text.length === 0) {
      return providerErrorResponse(
        request,
        this.adapterId,
        "edge-tts",
        "TTS_PROVIDER_ERROR",
        "TTS text is required",
        started,
      );
    }

    try {
      const audio = await edgeTtsSpeak(text, config.model ?? EDGE_TTS_VOICE);
      if (audio.length === 0) {
        return providerErrorResponse(
          request,
          this.adapterId,
          "edge-tts",
          "TTS_PROVIDER_ERROR",
          "Edge TTS returned empty audio",
          started,
        );
      }
      return {
        requestId: request.requestId,
        adapterId: this.adapterId,
        providerId: "edge-tts",
        stub: false,
        output: text,
        audioBase64: audio.toString("base64"),
        mimeType: "audio/mpeg",
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return providerErrorResponse(
        request,
        this.adapterId,
        "edge-tts",
        "TTS_PROVIDER_ERROR",
        error instanceof Error ? error.message : "Edge TTS synthesis failed",
        started,
      );
    }
  }
}

/**
 * HTTP TTS adapter. Provider errors are fail-closed (stub=false).
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
      return providerErrorResponse(
        request,
        this.adapterId,
        config.providerId || this.providerId,
        "TTS_KEY_MISSING",
        "TTS provider is not configured. Set the required TTS API key and base URL before using live speech synthesis.",
        started,
      );
    }
    if (!config.apiKey) {
      return providerErrorResponse(
        request,
        this.adapterId,
        config.providerId || this.providerId,
        "TTS_KEY_MISSING",
        "TTS API key is missing. Configure the selected TTS provider before using live speech synthesis.",
        started,
      );
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
      if (!audio.audioBase64 || audio.audioBase64.length === 0) {
        return providerErrorResponse(
          request,
          this.adapterId,
          config.providerId || this.providerId,
          "TTS_PROVIDER_ERROR",
          "TTS provider returned empty audio",
          started,
        );
      }
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
      return providerErrorResponse(
        request,
        this.adapterId,
        config.providerId || this.providerId,
        "TTS_PROVIDER_ERROR",
        error instanceof Error ? error.message : "TTS provider request failed",
        started,
      );
    }
  }
}

/**
 * OpenAI-compatible TTS (Groq / OpenAI) when Edge TTS is unavailable.
 */
export class OpenAiCompatibleTtsAdapter implements TextToSpeechAdapter {
  readonly adapterId: string;
  private readonly providerId: string;
  private readonly baseUrl: string;
  private readonly apiKeyEnvVars: readonly string[];

  constructor(options: {
    readonly adapterId: string;
    readonly providerId: string;
    readonly baseUrl: string;
    readonly apiKeyEnvVars: readonly string[];
  }) {
    this.adapterId = options.adapterId;
    this.providerId = options.providerId;
    this.baseUrl = options.baseUrl;
    this.apiKeyEnvVars = options.apiKeyEnvVars;
  }

  async synthesize(
    request: SpeechRequest,
    config: SpeechProviderConfig = DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  ): Promise<SpeechResponse> {
    const started = Date.now();
    const apiKey = config.apiKey ?? readEnvApiKey(this.apiKeyEnvVars);
    if (!apiKey) {
      return providerErrorResponse(
        request,
        this.adapterId,
        this.providerId,
        "TTS_KEY_MISSING",
        "TTS API key is missing for OpenAI-compatible TTS fallback",
        started,
      );
    }

    try {
      const audio = await synthesizeHttp(
        `${config.baseUrl ?? this.baseUrl}/audio/speech`,
        apiKey,
        {
          model: config.model ?? "tts-1",
          input: request.text,
          voice: "alloy",
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
      return providerErrorResponse(
        request,
        this.adapterId,
        config.providerId || this.providerId,
        "TTS_PROVIDER_ERROR",
        error instanceof Error ? error.message : "OpenAI-compatible TTS failed",
        started,
      );
    }
  }
}

export const ElevenLabsTtsAdapter = new HttpTextToSpeechAdapter({
  adapterId: "elevenlabs-tts-adapter",
  providerId: "elevenlabs",
  endpointPath: "/text-to-speech/default",
});

export const OpenAiTtsAdapter = new OpenAiCompatibleTtsAdapter({
  adapterId: "openai-tts-adapter",
  providerId: "openai-tts",
  baseUrl: "https://api.openai.com/v1",
  apiKeyEnvVars: ["OPENAI_API_KEY", "JARVIS_OPENAI_API_KEY"],
});

export const EdgeTtsAdapter = new EdgeTtsSpeechAdapter();

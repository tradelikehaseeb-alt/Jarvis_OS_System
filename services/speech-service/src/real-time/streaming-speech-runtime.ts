import type { SpeechToTextAdapter } from "../adapters/speech-to-text-adapter";
import {
  DEFAULT_STUB_SPEECH_PROVIDER_CONFIG,
  type SpeechProviderConfig,
} from "../adapters/speech-provider-config";
import type { SpeechRequest } from "../adapters/speech-request";
import type { SpeechResponse } from "../adapters/speech-response";
import { StubSpeechToTextAdapterLegacy } from "../adapters/stub-speech-to-text-adapter-legacy";

import { DesktopIpcSpeechToTextAdapter, hasDesktopSpeechBridge } from "./desktop-ipc-speech-adapters";
import {
  isBrowserLikeEnvironment,
  isJarvisRendererBuild,
} from "./environment";
import type { MicrophoneRuntime } from "./microphone-runtime";
import { SyntheticMicrophoneRuntime } from "./microphone-runtime";
import { RealTimeTranscriptionSession } from "./real-time-transcription-session";

export interface StreamingSpeechRuntimeOptions {
  readonly microphone?: MicrophoneRuntime;
  readonly sttAdapter?: SpeechToTextAdapter;
  readonly sttConfig?: SpeechProviderConfig;
}

function splitPartialWords(text: string, count: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, count).join(" ");
}

/**
 * Real-time streaming speech runtime — microphone → partial STT → final transcript (Phase 91).
 */
export class StreamingSpeechRuntime {
  private readonly microphone: MicrophoneRuntime;
  private readonly sttAdapter: SpeechToTextAdapter;
  private readonly sttConfig: SpeechProviderConfig;
  private readonly session = new RealTimeTranscriptionSession();
  private audioChunks: string[] = [];
  private capturing = false;

  constructor(options: StreamingSpeechRuntimeOptions = {}) {
    this.microphone = options.microphone ?? new SyntheticMicrophoneRuntime();
    if (options.sttAdapter) {
      this.sttConfig = options.sttConfig ?? DEFAULT_STUB_SPEECH_PROVIDER_CONFIG;
      this.sttAdapter = options.sttAdapter;
      return;
    }
    if (isJarvisRendererBuild() || isBrowserLikeEnvironment()) {
      if (hasDesktopSpeechBridge()) {
        this.sttConfig = {
          providerId: "groq",
          mode: "live",
        };
        this.sttAdapter = new DesktopIpcSpeechToTextAdapter();
        return;
      }
      this.sttConfig = options.sttConfig ?? DEFAULT_STUB_SPEECH_PROVIDER_CONFIG;
      this.sttAdapter = new StubSpeechToTextAdapterLegacy();
      return;
    }
    const { resolveFirstConfiguredSttProvider } =
      require("./speech-provider-resolver") as typeof import("./speech-provider-resolver");
    const { resolveStreamingSttAdapter } =
      require("./resolve-streaming-stt-adapter") as typeof import("./resolve-streaming-stt-adapter");
    this.sttConfig = options.sttConfig ?? resolveFirstConfiguredSttProvider();
    this.sttAdapter = resolveStreamingSttAdapter(this.sttConfig, options.sttAdapter);
  }

  getTranscriptionSession(): RealTimeTranscriptionSession {
    return this.session;
  }

  getMicrophone(): MicrophoneRuntime {
    return this.microphone;
  }

  getSttConfig(): SpeechProviderConfig {
    return this.sttConfig;
  }

  subscribe(listener: Parameters<RealTimeTranscriptionSession["subscribe"]>[0]): () => void {
    return this.session.subscribe(listener);
  }

  async startListening(signal?: AbortSignal): Promise<void> {
    if (this.capturing) {
      return;
    }
    this.capturing = true;
    this.session.reset();
    this.audioChunks = [];

    await this.microphone.startCapture({
      signal,
      onFrame: (frame) => {
        if (signal?.aborted) {
          return;
        }
        const pcm = frame.pcm;
        const bytes = pcm instanceof Uint8Array ? pcm : new Uint8Array(pcm.buffer);
        let binary = "";
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          const slice = bytes.subarray(offset, offset + chunkSize);
          binary += String.fromCharCode(...slice);
        }
        const encoded = btoa(binary);
        this.audioChunks.push(encoded);
        if (this.sttConfig.mode !== "live") {
          const draft = `listening ${this.audioChunks.length}`;
          this.session.appendPartial(
            draft,
            0.55 + Math.min(0.4, this.audioChunks.length * 0.02),
            40 + this.audioChunks.length * 8,
          );
        }
      },
    });
  }

  stopListening(): void {
    this.microphone.stopCapture();
    this.capturing = false;
  }

  async finalizeTranscript(requestId: string, hintText = ""): Promise<SpeechResponse> {
    const started = Date.now();
    const recorded = await this.microphone.flushRecordedAudio?.();
    this.stopListening();

    if (!recorded?.audioBase64?.trim()) {
      return {
        requestId,
        adapterId: this.sttAdapter.adapterId,
        providerId: this.sttConfig.providerId,
        stub: false,
        output: "",
        confidence: 0,
        latencyMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        error: {
          code: "EMPTY_AUDIO_BUFFER",
          message: "No recorded audio captured from microphone",
        },
      };
    }

    const request: SpeechRequest = {
      requestId,
      text: hintText,
      audioBase64: recorded.audioBase64,
      mimeType: recorded.mimeType ?? "audio/webm",
    };

    const response = await this.sttAdapter.transcribe(request, this.sttConfig);
    const words = response.output.split(/\s+/).filter(Boolean);
    for (let i = 1; i < words.length; i += 1) {
      this.session.appendPartial(
        splitPartialWords(response.output, i),
        response.confidence ?? 0.8,
        response.latencyMs ?? Date.now() - started,
      );
    }

    this.session.finalize(
      response.output,
      response.confidence ?? (response.stub ? 0.65 : 0.9),
      response.latencyMs ?? Date.now() - started,
    );

    return response;
  }

  interrupt(): void {
    this.stopListening();
    this.session.reset();
    this.audioChunks = [];
  }
}

export function createDefaultStreamingSpeechRuntime(
  options?: StreamingSpeechRuntimeOptions,
): StreamingSpeechRuntime {
  return new StreamingSpeechRuntime(options);
}

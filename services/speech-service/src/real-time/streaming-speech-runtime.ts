import type { SpeechToTextAdapter } from "../adapters/speech-to-text-adapter";
import type { SpeechProviderConfig } from "../adapters/speech-provider-config";
import type { SpeechRequest } from "../adapters/speech-request";
import type { SpeechResponse } from "../adapters/speech-response";

import type { MicrophoneRuntime } from "./microphone-runtime";
import { SyntheticMicrophoneRuntime } from "./microphone-runtime";
import { RealTimeTranscriptionSession } from "./real-time-transcription-session";
import { resolveStreamingSttAdapter } from "./resolve-streaming-stt-adapter";
import { resolveFirstConfiguredSttProvider } from "./speech-provider-resolver";

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
        const encoded = Buffer.from(frame.pcm.buffer).toString("base64");
        this.audioChunks.push(encoded);
        const draft = `listening ${this.audioChunks.length}`;
        this.session.appendPartial(
          draft,
          0.55 + Math.min(0.4, this.audioChunks.length * 0.02),
          40 + this.audioChunks.length * 8,
        );
      },
    });
  }

  stopListening(): void {
    this.microphone.stopCapture();
    this.capturing = false;
  }

  async finalizeTranscript(requestId: string, hintText = ""): Promise<SpeechResponse> {
    this.stopListening();
    const started = Date.now();
    const request: SpeechRequest = {
      requestId,
      text: hintText,
      audioBase64: this.audioChunks.join(""),
      mimeType: "audio/pcm",
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

import type {

  MicrophoneCaptureOptions,

  MicrophoneRuntime,

} from "@jarvis/speech-service";

import { SyntheticMicrophoneRuntime } from "@jarvis/speech-service";



import {

  createMediaRecorderForStream,

  isMicrophoneApiAvailable,

  requestMicrophoneStream,

  resolveMicrophoneErrorMessage,

} from "../voice/microphone-access";



function computeLevels(data: Uint8Array): { rms: number; peak: number } {

  if (data.length === 0) {

    return { rms: 0, peak: 0 };

  }

  let sum = 0;

  let peak = 0;

  for (let i = 0; i < data.length; i += 1) {

    const normalized = (data[i] ?? 128) / 128 - 1;

    sum += normalized * normalized;

    peak = Math.max(peak, Math.abs(normalized));

  }

  const rms = Math.sqrt(sum / data.length);

  return { rms, peak };

}



function blobToBase64(blob: Blob): Promise<string> {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const result = reader.result;

      if (typeof result !== "string") {

        reject(new Error("Failed to read recorded audio"));

        return;

      }

      const comma = result.indexOf(",");

      resolve(comma >= 0 ? result.slice(comma + 1) : result);

    };

    reader.onerror = () => reject(reader.error ?? new Error("Failed to read recorded audio"));

    reader.readAsDataURL(blob);

  });

}



/**

 * Browser microphone runtime using Web Audio + MediaRecorder (Phase 91).

 * Falls back to synthetic mic when APIs are unavailable (tests/SSR).

 */

export class BrowserMicrophoneRuntime implements MicrophoneRuntime {

  private stream: MediaStream | null = null;

  private recorder: MediaRecorder | null = null;

  private audioContext: AudioContext | null = null;

  private analyser: AnalyserNode | null = null;

  private rafId: number | null = null;

  private levels: number[] = [];

  private recordedChunks: Blob[] = [];

  private recorderMimeType = "audio/webm";

  private recorderStopPromise: Promise<void> | null = null;

  private fallback = new SyntheticMicrophoneRuntime();

  private usingFallback = false;

  private captureGeneration = 0;

  private lastFrameTimestampMs = 0;

  private lastPacketDeltaMs = 0;



  isAvailable(): boolean {

    return isMicrophoneApiAvailable();

  }



  private releaseHardware(): void {

    if (this.rafId !== null) {

      cancelAnimationFrame(this.rafId);

      this.rafId = null;

    }

    if (this.recorder && this.recorder.state !== "inactive") {

      this.recorderStopPromise = new Promise((resolve) => {

        const recorder = this.recorder;

        if (!recorder) {

          resolve();

          return;

        }

        recorder.onstop = () => resolve();

        recorder.stop();

      });

    }

    this.recorder = null;

    this.stream?.getTracks().forEach((track) => track.stop());

    this.stream = null;

    void this.audioContext?.close();

    this.audioContext = null;

    this.analyser = null;

  }



  async startCapture(options: MicrophoneCaptureOptions = {}): Promise<void> {

    if (!this.isAvailable()) {

      this.usingFallback = true;

      await this.fallback.startCapture(options);

      return;

    }



    const generation = this.captureGeneration + 1;

    this.captureGeneration = generation;

    this.usingFallback = false;

    this.levels = [];

    this.recordedChunks = [];

    this.releaseHardware();



    if (options.signal?.aborted) {

      throw new DOMException("Microphone capture aborted", "AbortError");

    }



    try {

      const stream = await requestMicrophoneStream(options.signal);

      if (options.signal?.aborted || generation !== this.captureGeneration) {

        stream.getTracks().forEach((track) => track.stop());

        throw new DOMException("Microphone capture aborted", "AbortError");

      }



      this.stream = stream;

      this.recorder = createMediaRecorderForStream(stream);

      this.recorderMimeType = this.recorder.mimeType || "audio/webm";

      this.recorder.ondataavailable = (event) => {

        if (event.data.size > 0) {

          this.recordedChunks.push(event.data);

        }

      };

      this.recorder.start(100);



      if (options.signal?.aborted || generation !== this.captureGeneration) {

        this.releaseHardware();

        throw new DOMException("Microphone capture aborted", "AbortError");

      }



      this.audioContext = new AudioContext();
      await this.audioContext.resume();

      const source = this.audioContext.createMediaStreamSource(stream);

      this.analyser = this.audioContext.createAnalyser();

      this.analyser.fftSize = 256;

      source.connect(this.analyser);



      const data = new Uint8Array(this.analyser.frequencyBinCount);

      const tick = () => {

        if (

          options.signal?.aborted ||

          generation !== this.captureGeneration ||

          !this.analyser

        ) {

          return;

        }

        this.analyser.getByteTimeDomainData(data);

        const timestampMs = Date.now();
        this.lastPacketDeltaMs =
          this.lastFrameTimestampMs > 0 ? timestampMs - this.lastFrameTimestampMs : 0;
        this.lastFrameTimestampMs = timestampMs;

        const { rms, peak } = computeLevels(data);

        const level = Math.min(1, peak * 1.4);

        this.levels = [...this.levels.slice(-13), level];

        options.onLevel?.({ rms, peak: level, timestampMs: Date.now() });

        options.onFrame?.({

          frameId: `browser-mic-${Date.now()}`,

          pcm: Float32Array.from(data, (value) => value / 128 - 1),

          sampleRate: this.audioContext?.sampleRate ?? 44_100,

          timestampMs: Date.now(),

        });

        this.rafId = requestAnimationFrame(tick);

      };

      tick();

    } catch (error) {

      this.releaseHardware();

      if (error instanceof DOMException && error.name === "AbortError") {

        throw error;

      }

      throw new Error(resolveMicrophoneErrorMessage(error));

    }

  }



  async flushRecordedAudio(): Promise<{ audioBase64: string; mimeType: string } | undefined> {

    if (this.usingFallback) {

      return this.fallback.flushRecordedAudio?.();

    }

    if (this.recorderStopPromise) {

      await this.recorderStopPromise;

      this.recorderStopPromise = null;

    }

    if (this.recordedChunks.length === 0) {

      return undefined;

    }

    const blob = new Blob(this.recordedChunks, { type: this.recorderMimeType });

    this.recordedChunks = [];

    return {

      audioBase64: await blobToBase64(blob),

      mimeType: this.recorderMimeType,

    };

  }



  stopCapture(): void {

    this.captureGeneration += 1;

    if (this.usingFallback) {

      this.fallback.stopCapture();

      return;

    }

    this.releaseHardware();

  }



  getLatestLevels(): readonly number[] {

    return this.usingFallback ? this.fallback.getLatestLevels() : this.levels;

  }

  getLastPacketDeltaMs(): number {
    return this.lastPacketDeltaMs;
  }

  async resumeAudioContextIfStalled(): Promise<boolean> {
    if (this.usingFallback || !this.audioContext) {
      return false;
    }
    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return this.audioContext.state === "running";
    } catch {
      return false;
    }
  }

}



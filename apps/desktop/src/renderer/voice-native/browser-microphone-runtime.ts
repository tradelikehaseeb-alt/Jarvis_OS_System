import type {
  MicrophoneCaptureOptions,
  MicrophoneRuntime,
} from "@jarvis/speech-service";
import { SyntheticMicrophoneRuntime } from "@jarvis/speech-service";

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
  private fallback = new SyntheticMicrophoneRuntime();
  private usingFallback = false;

  isAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia)
    );
  }

  async startCapture(options: MicrophoneCaptureOptions = {}): Promise<void> {
    if (!this.isAvailable()) {
      this.usingFallback = true;
      await this.fallback.startCapture(options);
      return;
    }

    this.usingFallback = false;
    this.levels = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (options.signal?.aborted) {
        this.stopCapture();
        return;
      }
      this.analyser?.getByteTimeDomainData(data);
      const { rms, peak } = computeLevels(data);
      const level = Math.min(1, peak * 1.4);
      this.levels = [...this.levels.slice(-13), level];
      options.onLevel?.({ rms, peak: level, timestampMs: Date.now() });
      options.onFrame?.({
        frameId: `browser-mic-${Date.now()}`,
        pcm: Float32Array.from(data, (value) => (value / 128) - 1),
        sampleRate: this.audioContext?.sampleRate ?? 44_100,
        timestampMs: Date.now(),
      });
      this.rafId = requestAnimationFrame(tick);
    };
    tick();

    this.recorder = new MediaRecorder(this.stream);
    this.recorder.start(100);
  }

  stopCapture(): void {
    if (this.usingFallback) {
      this.fallback.stopCapture();
      return;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.recorder?.stop();
    this.recorder = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
  }

  getLatestLevels(): readonly number[] {
    return this.usingFallback ? this.fallback.getLatestLevels() : this.levels;
  }
}

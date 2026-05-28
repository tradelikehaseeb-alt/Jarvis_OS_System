/**
 * Microphone capture contract for real-time voice (Phase 91).
 */
export interface MicrophoneAudioFrame {
  readonly frameId: string;
  readonly pcm: Float32Array;
  readonly sampleRate: number;
  readonly timestampMs: number;
}

export interface MicrophoneLevelSample {
  readonly rms: number;
  readonly peak: number;
  readonly timestampMs: number;
}

export interface MicrophoneCaptureOptions {
  readonly signal?: AbortSignal;
  readonly onFrame?: (frame: MicrophoneAudioFrame) => void;
  readonly onLevel?: (sample: MicrophoneLevelSample) => void;
}

export interface MicrophoneRuntime {
  readonly isAvailable: () => boolean;
  readonly startCapture: (options?: MicrophoneCaptureOptions) => Promise<void>;
  readonly stopCapture: () => void;
  readonly getLatestLevels: () => readonly number[];
}

function computeRms(pcm: Float32Array): number {
  if (pcm.length === 0) {
    return 0;
  }
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < pcm.length; i += 1) {
    const value = pcm[i] ?? 0;
    sum += value * value;
    peak = Math.max(peak, Math.abs(value));
  }
  return Math.sqrt(sum / pcm.length);
}

/**
 * Deterministic synthetic microphone for tests and stub fallback (Phase 91).
 */
export class SyntheticMicrophoneRuntime implements MicrophoneRuntime {
  private capturing = false;
  private levels: number[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private frameSequence = 0;

  isAvailable(): boolean {
    return true;
  }

  async startCapture(options: MicrophoneCaptureOptions = {}): Promise<void> {
    if (this.capturing) {
      return;
    }
    this.capturing = true;
    this.levels = [];

    const tick = () => {
      if (options.signal?.aborted) {
        this.stopCapture();
        return;
      }
      this.frameSequence += 1;
      const pcm = new Float32Array(128);
      const phase = this.frameSequence * 0.15;
      for (let i = 0; i < pcm.length; i += 1) {
        pcm[i] = Math.sin(phase + i * 0.08) * 0.35;
      }
      const rms = computeRms(pcm);
      const level = Math.min(1, rms * 2.5);
      this.levels = [...this.levels.slice(-13), level];
      options.onLevel?.({
        rms,
        peak: level,
        timestampMs: Date.now(),
      });
      options.onFrame?.({
        frameId: `mic-frame-${this.frameSequence}`,
        pcm,
        sampleRate: 16_000,
        timestampMs: Date.now(),
      });
    };

    tick();
    this.intervalId = setInterval(tick, 60);
  }

  stopCapture(): void {
    this.capturing = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getLatestLevels(): readonly number[] {
    return this.levels;
  }
}

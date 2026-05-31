import type { SpeechResponse } from "../speech-response";

type ActiveJob = {
  readonly resolve: (value: SpeechResponse) => void;
  readonly reject: (reason: unknown) => void;
};

/**
 * Single-flight TTS queue — new commands cancel in-flight synthesis (max 3 waiters).
 */
export class TtsSpeechQueue {
  private readonly maxSize: number;
  private waiters: Array<() => Promise<SpeechResponse>> = [];
  private active: ActiveJob | null = null;
  private processing = false;

  constructor(maxSize = 3) {
    this.maxSize = maxSize;
  }

  get pendingCount(): number {
    return this.waiters.length;
  }

  cancelAll(): void {
    if (this.active) {
      this.active.reject(new Error("TTS_CANCELLED"));
      this.active = null;
    }
    this.waiters = [];
    this.processing = false;
  }

  enqueue(task: () => Promise<SpeechResponse>): Promise<SpeechResponse> {
    this.cancelAll();
    return new Promise((resolve, reject) => {
      this.waiters.push(task);
      while (this.waiters.length > this.maxSize) {
        this.waiters.shift();
      }
      void this.pump(resolve, reject);
    });
  }

  private async pump(
    resolve: (value: SpeechResponse) => void,
    reject: (reason: unknown) => void,
  ): Promise<void> {
    if (this.processing) {
      return;
    }
    const task = this.waiters[this.waiters.length - 1];
    if (!task) {
      reject(new Error("TTS_QUEUE_EMPTY"));
      return;
    }
    this.waiters = [];
    this.processing = true;
    this.active = { resolve, reject };
    try {
      const response = await task();
      if (this.active?.resolve === resolve) {
        resolve(response);
      }
    } catch (error) {
      if (this.active?.reject === reject) {
        reject(error);
      }
    } finally {
      this.active = null;
      this.processing = false;
    }
  }
}

/** Shared queue for default Jarvis TTS adapter. */
export const defaultTtsSpeechQueue = new TtsSpeechQueue(3);

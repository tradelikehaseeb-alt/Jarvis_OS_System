export interface TranscriptionPartial {
  readonly text: string;
  readonly confidence: number;
  readonly latencyMs: number;
  readonly isFinal: boolean;
  readonly at: string;
}

export type TranscriptionListener = (partial: TranscriptionPartial) => void;

/**
 * Live streaming transcription session with partial + final events (Phase 91).
 */
export class RealTimeTranscriptionSession {
  private readonly listeners = new Set<TranscriptionListener>();
  private partialText = "";
  private confidence = 0;
  private latencyMs = 0;
  private closed = false;

  subscribe(listener: TranscriptionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  appendPartial(text: string, confidence: number, latencyMs: number): void {
    if (this.closed) {
      return;
    }
    this.partialText = text;
    this.confidence = confidence;
    this.latencyMs = latencyMs;
    this.emit({
      text,
      confidence,
      latencyMs,
      isFinal: false,
      at: new Date().toISOString(),
    });
  }

  finalize(text: string, confidence: number, latencyMs: number): string {
    this.partialText = text;
    this.confidence = confidence;
    this.latencyMs = latencyMs;
    this.closed = true;
    this.emit({
      text,
      confidence,
      latencyMs,
      isFinal: true,
      at: new Date().toISOString(),
    });
    return text;
  }

  getPartialText(): string {
    return this.partialText;
  }

  getConfidence(): number {
    return this.confidence;
  }

  getLatencyMs(): number {
    return this.latencyMs;
  }

  reset(): void {
    this.partialText = "";
    this.confidence = 0;
    this.latencyMs = 0;
    this.closed = false;
  }

  private emit(partial: TranscriptionPartial): void {
    for (const listener of this.listeners) {
      listener(partial);
    }
  }
}

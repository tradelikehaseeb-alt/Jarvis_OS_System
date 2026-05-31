import {
  detectWakeWordInTranscript,
  speak,
  transcribe,
} from "@jarvis/speech-service";

export type RealVoiceSessionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export interface RealVoiceSessionState {
  readonly status: RealVoiceSessionStatus;
  readonly transcript: string;
  readonly isWakeWord: boolean;
  readonly confidence: number;
  readonly error: string | null;
}

type Listener = (state: RealVoiceSessionState) => void;

/**
 * Production voice session — speech-service STT/TTS with wake-word detection.
 */
export class RealVoiceSession {
  private state: RealVoiceSessionState = {
    status: "idle",
    transcript: "",
    isWakeWord: false,
    confidence: 0,
    error: null,
  };

  private readonly listeners = new Set<Listener>();
  private abortController: AbortController | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): RealVoiceSessionState {
    return this.state;
  }

  private emit(patch: Partial<RealVoiceSessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.emit({
      status: "idle",
      error: null,
    });
  }

  /**
   * Transcribe captured audio and detect wake phrase.
   */
  async processAudio(
    audioBuffer: Buffer,
    mimeType = "audio/webm",
  ): Promise<RealVoiceSessionState> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    this.emit({ status: "processing", error: null });

    try {
      const response = await transcribe(audioBuffer, { mimeType });
      if (controller.signal.aborted) {
        return this.state;
      }

      if (response.error) {
        this.emit({
          status: "error",
          error: response.error.message,
          transcript: "",
        });
        return this.state;
      }

      const wake =
        response.isWakeWord === true
          ? {
              isWakeWord: true,
              confidence: response.confidence ?? 0.9,
            }
          : detectWakeWordInTranscript(response.output);

      this.emit({
        status: wake.isWakeWord ? "listening" : "idle",
        transcript: response.output,
        isWakeWord: wake.isWakeWord,
        confidence: wake.confidence,
        error: null,
      });
      return this.state;
    } catch (error) {
      const message = error instanceof Error ? error.message : "STT failed";
      this.emit({ status: "error", error: message });
      return this.state;
    } finally {
      if (this.abortController === controller) {
        this.abortController = null;
      }
    }
  }

  /**
   * Speak assistant response (markdown stripped in speech-service).
   */
  async speakResponse(text: string): Promise<void> {
    this.emit({ status: "speaking", error: null });
    try {
      const response = await speak(text);
      if (response.error) {
        this.emit({
          status: "error",
          error: response.error.message,
        });
        return;
      }
      this.emit({ status: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "TTS failed";
      this.emit({ status: "error", error: message });
    }
  }
}

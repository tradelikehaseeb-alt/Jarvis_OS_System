import { pickMockTranscript } from "./mock-transcripts";

/** Simulated capture duration before a mock transcript is produced. */
export const MOCK_VOICE_LISTEN_MS = 1_200;

export class MockVoiceSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MockVoiceSessionError";
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });
}

export interface RunMockVoiceCaptureOptions {
  readonly simulateError?: boolean;
  readonly listenMs?: number;
  readonly seed?: number;
  readonly signal?: AbortSignal;
}

/**
 * Simulate voice capture without microphone or STT (Phase 25).
 */
export async function runMockVoiceCapture(
  options: RunMockVoiceCaptureOptions = {},
): Promise<{ readonly transcript: string }> {
  await delay(options.listenMs ?? MOCK_VOICE_LISTEN_MS, options.signal);

  if (options.simulateError) {
    throw new MockVoiceSessionError(
      "Mock voice capture failed (enable in Voice settings to test)",
    );
  }

  return { transcript: pickMockTranscript(options.seed) };
}

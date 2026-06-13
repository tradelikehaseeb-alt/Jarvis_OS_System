import { describe, expect, it, vi } from "vitest";

import {
  isAudioBufferTooSmall,
  isGroqSttFailureRetryable,
  speechDebug,
} from "../speech-ipc-helpers";

describe("speech-ipc-helpers", () => {
  it("detects undersized audio buffers", () => {
    expect(isAudioBufferTooSmall(Buffer.alloc(100))).toBe(true);
    expect(isAudioBufferTooSmall(Buffer.alloc(1024))).toBe(false);
  });

  it("flags Groq rate-limit and transient failures as retryable", () => {
    expect(isGroqSttFailureRetryable("Groq Whisper failed: 429 rate limit")).toBe(true);
    expect(isGroqSttFailureRetryable("Groq Whisper failed: 503 unavailable")).toBe(true);
    expect(isGroqSttFailureRetryable("authentication exhausted")).toBe(true);
    expect(isGroqSttFailureRetryable("NO_SPEECH_DETECTED")).toBe(false);
    expect(isGroqSttFailureRetryable("invalid api key")).toBe(false);
  });

  it("speechDebug writes tagged console output", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    speechDebug("STT Triggered", { bytes: 1200 });
    expect(info).toHaveBeenCalledWith("[speech-debug] STT Triggered", { bytes: 1200 });
    info.mockRestore();
  });
});

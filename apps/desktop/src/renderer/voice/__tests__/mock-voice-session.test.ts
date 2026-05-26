import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MockVoiceSessionError,
  MOCK_VOICE_LISTEN_MS,
  runMockVoiceCapture,
} from "../mock-voice-session";

describe("runMockVoiceCapture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns mock transcript after listen delay", async () => {
    const promise = runMockVoiceCapture({ seed: 0 });
    await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS);
    const result = await promise;
    expect(result.transcript.length).toBeGreaterThan(0);
  });

  it("throws when simulateError is enabled", async () => {
    const promise = runMockVoiceCapture({ simulateError: true });
    const assertion = expect(promise).rejects.toBeInstanceOf(MockVoiceSessionError);
    await vi.advanceTimersByTimeAsync(MOCK_VOICE_LISTEN_MS);
    await assertion;
  });

  it("aborts when signal is aborted", async () => {
    const controller = new AbortController();
    const promise = runMockVoiceCapture({ signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });
});

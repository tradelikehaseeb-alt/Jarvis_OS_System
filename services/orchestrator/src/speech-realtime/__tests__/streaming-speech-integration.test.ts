import { describe, expect, it, vi } from "vitest";

import { createOrchestratorStreamingSpeechRuntime } from "../create-orchestrator-streaming-speech-runtime";

describe("orchestrator streaming speech integration", () => {
  it("captures synthetic microphone audio and returns transcript", async () => {
    vi.useFakeTimers();
    const { captureDelegate } = createOrchestratorStreamingSpeechRuntime();
    const controller = new AbortController();

    const capturePromise = captureDelegate.capture({
      mode: "push-to-talk",
      signal: controller.signal,
    });
    await vi.advanceTimersByTimeAsync(250);
    const result = await capturePromise;

    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.partialChunks?.length ?? 0).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});

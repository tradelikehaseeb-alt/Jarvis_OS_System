import { describe, expect, it } from "vitest";

import { BrowserMicrophoneRuntime } from "../browser-microphone-runtime";

describe("BrowserMicrophoneRuntime", () => {
  it("falls back when getUserMedia is unavailable", async () => {
    const runtime = new BrowserMicrophoneRuntime();
    expect(runtime.isAvailable()).toBe(false);

    await runtime.startCapture({
      onLevel: () => undefined,
    });
    expect(runtime.getLatestLevels().length).toBeGreaterThan(0);
    runtime.stopCapture();
  });
});

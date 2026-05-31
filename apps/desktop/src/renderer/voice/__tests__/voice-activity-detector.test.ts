import { describe, expect, it, vi } from "vitest";

import { VOICE_SILENCE_STOP_MS } from "../voice-activity-detector";

describe("VOICE_SILENCE_STOP_MS", () => {
  it("uses 2 second silence threshold", () => {
    expect(VOICE_SILENCE_STOP_MS).toBe(2000);
  });
});

describe("startVoiceActivityDetector", () => {
  it("is exported from voice-activity-detector module", async () => {
    const mod = await import("../voice-activity-detector");
    expect(typeof mod.startVoiceActivityDetector).toBe("function");
  });
});

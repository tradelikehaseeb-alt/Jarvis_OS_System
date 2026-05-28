import { describe, expect, it } from "vitest";

import { mapRealWorldVoiceCommand } from "../real-world-voice-validation";

describe("mapRealWorldVoiceCommand", () => {
  it("recognizes canonical real-world voice commands", () => {
    const result = mapRealWorldVoiceCommand(
      "Jarvis, open YouTube and search AI news",
    );

    expect(result.recognized).toBe(true);
    expect(result.expectsBrowser).toBe(true);
  });
});

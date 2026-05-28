import { describe, expect, it } from "vitest";

import { mapVoiceTranscriptToContinuousIntent } from "../continuous-voice-intent";

describe("mapVoiceTranscriptToContinuousIntent", () => {
  it("detects monitor voice command", () => {
    const intent = mapVoiceTranscriptToContinuousIntent(
      "Jarvis monitor gold market changes and alert me",
    );

    expect(intent.continuous).toBe(true);
    expect(intent.userLabel).toBe("Monitoring…");
    expect(intent.spokenNotification).toContain("monitor");
  });

  it("detects background continuation", () => {
    const intent = mapVoiceTranscriptToContinuousIntent(
      "continue this workflow in background",
    );

    expect(intent.background).toBe(true);
    expect(intent.userLabel).toBe("Running in background…");
  });
});

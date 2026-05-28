import { describe, expect, it } from "vitest";

import { VOICE_SESSION_DISPLAY_LABELS, voiceSessionLabel } from "../voice-session-labels";

describe("voiceSessionLabel", () => {
  it("returns user-facing labels without internal runtime names", () => {
    expect(voiceSessionLabel("listening")).toBe("Listening");
    expect(voiceSessionLabel("thinking")).toBe("Thinking");
    expect(voiceSessionLabel("executing")).toBe("Executing");
    expect(VOICE_SESSION_DISPLAY_LABELS.speaking).toBe("Speaking");
    expect(VOICE_SESSION_DISPLAY_LABELS.executing).not.toContain("Hermes");
    expect(VOICE_SESSION_DISPLAY_LABELS.executing).not.toContain("OpenClaw");
  });
});

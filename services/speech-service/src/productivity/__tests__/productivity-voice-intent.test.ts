import { describe, expect, it } from "vitest";

import { mapVoiceTranscriptToProductivityIntent } from "../productivity-voice-intent";

describe("mapVoiceTranscriptToProductivityIntent", () => {
  it("detects email productivity voice command", () => {
    const intent = mapVoiceTranscriptToProductivityIntent(
      "Jarvis summarize unread emails and prepare my priorities",
    );

    expect(intent.productivity).toBe(true);
    expect(intent.userLabel).toBe("Reviewing emails…");
  });

  it("detects follow-up likely for chained commands", () => {
    const intent = mapVoiceTranscriptToProductivityIntent(
      "research AI news and then brief me",
    );

    expect(intent.followUpLikely).toBe(true);
  });
});

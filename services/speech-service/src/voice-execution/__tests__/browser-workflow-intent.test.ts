import { describe, expect, it } from "vitest";

import {
  mapVoiceTranscriptToBrowserWorkflow,
  voiceHintToTaskIntent,
} from "../browser-workflow-intent";

describe("browser-workflow-intent", () => {
  it("maps Gmail summarize voice command", () => {
    const hint = mapVoiceTranscriptToBrowserWorkflow(
      "Jarvis, open Gmail and summarize unread emails",
    );

    expect(hint?.automate).toBe(true);
    expect(hint?.url).toContain("mail.google.com");
    expect(hint?.includesSummarize).toBe(true);
    expect(voiceHintToTaskIntent(hint!).kind).toBe("automate");
  });
});

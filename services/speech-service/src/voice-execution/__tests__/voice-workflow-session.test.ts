import { describe, expect, it } from "vitest";

import { createVoiceWorkflowSession } from "../voice-workflow-session";

describe("VoiceWorkflowSession", () => {
  it("tracks wake → transcript → execution phases", () => {
    const session = createVoiceWorkflowSession();
    session.onWakeWord();
    session.onTranscript("Jarvis, open Gmail and check unread emails");

    expect(session.getState().phase).toBe("processing");
    expect(session.getState().workflowHint?.url).toContain("mail.google.com");

    session.onExecutionStart();
    session.onSpeaking();
    session.onComplete();

    expect(session.getState().phase).toBe("completed");
  });

  it("handles interruption and continuation", () => {
    const session = createVoiceWorkflowSession();
    session.onWakeWord();
    session.onTranscript("Jarvis, open YouTube and summarize AI news");
    session.onExecutionStart();
    session.onInterrupt();

    expect(session.getState().interrupted).toBe(true);
    expect(session.getState().phase).toBe("interrupted");
  });
});

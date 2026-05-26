import { describe, expect, it } from "vitest";

import {
  InMemorySpeechSessionManager,
  createDefaultSpeechSessionManager,
} from "../session";

describe("speech session manager", () => {
  it("creates deterministic idle session", () => {
    const manager = new InMemorySpeechSessionManager();
    const session = manager.createSession("s-1");

    expect(session).toMatchObject({
      sessionId: "s-1",
      state: "idle",
      transcript: "",
      createdAt: new Date(0).toISOString(),
    });
    expect(session.events.length).toBe(1);
    expect(session.events[0]?.type).toBe("state-updated");
  });

  it("supports updateState and appendTranscript", () => {
    const manager = new InMemorySpeechSessionManager();
    manager.createSession("s-2");
    manager.updateState("s-2", "listening", "capture started");
    const session = manager.appendTranscript("s-2", "hello");

    expect(session.state).toBe("listening");
    expect(session.transcript).toBe("hello");
    expect(session.events.at(-1)?.type).toBe("transcript-appended");
  });

  it("supports getSession and endSession", () => {
    const manager = new InMemorySpeechSessionManager();
    manager.createSession("s-3");
    manager.appendTranscript("s-3", "done");
    const ended = manager.endSession("s-3", "finished");

    expect(manager.getSession("s-3")).toEqual(ended);
    expect(ended.state).toBe("completed");
    expect(ended.endedAt).toBe(new Date(0).toISOString());
    expect(ended.events.at(-1)?.type).toBe("session-ended");
  });

  it("throws descriptive error for unknown session", () => {
    const manager = new InMemorySpeechSessionManager();
    expect(() => manager.updateState("missing", "processing")).toThrow(
      "Speech session not found: missing",
    );
  });

  it("creates default manager instance", () => {
    const manager = createDefaultSpeechSessionManager();
    const session = manager.createSession();
    expect(session.sessionId.startsWith("speech-session-")).toBe(true);
  });
});

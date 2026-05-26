import { describe, expect, it } from "vitest";

import {
  InMemorySpeechConversationManager,
  InMemorySpeechEventBus,
  InMemorySpeechSessionManager,
  SpeechActionRouter,
  SpeechNormalizer,
  createDefaultSpeechActionRouter,
} from "../index";
import { InMemorySpeechActionRegistry } from "../actions";

describe("speech-service integration", () => {
  it("normal conversation flow: normalize -> conversation -> action -> events -> session complete", () => {
    const normalizer = new SpeechNormalizer();
    const conversationManager = new InMemorySpeechConversationManager();
    const actionRouter = createDefaultSpeechActionRouter();
    const eventBus = new InMemorySpeechEventBus();
    const sessionManager = new InMemorySpeechSessionManager();

    const emitted: string[] = [];
    eventBus.subscribe((event) => {
      emitted.push(event.type);
    });

    const normalized = normalizer.normalize("for eggs analysis", {
      domain: "trading",
    });
    expect(normalized.normalized).toBe("forex analysis");

    const conversation = conversationManager.createConversation("conv-e2e-1", {
      metadata: { source: "integration-test" },
    });
    conversationManager.appendUserTurn(conversation.conversationId, normalized.normalized);

    const action = actionRouter.route({
      requestId: "req-e2e-1",
      transcript: "help",
      conversationId: conversation.conversationId,
    });
    expect(action.handled).toBe(true);

    const session = sessionManager.createSession("sess-e2e-1");
    eventBus.emit({
      eventId: "event-1",
      type: "session-created",
      sessionId: session.sessionId,
      at: new Date(0).toISOString(),
      payload: { state: "idle" },
    });
    sessionManager.updateState(session.sessionId, "listening");
    eventBus.emit({
      eventId: "event-2",
      type: "listening-started",
      sessionId: session.sessionId,
      at: new Date(0).toISOString(),
      payload: { state: "listening" },
    });
    sessionManager.appendTranscript(session.sessionId, normalized.normalized);
    eventBus.emit({
      eventId: "event-3",
      type: "transcript-final",
      sessionId: session.sessionId,
      at: new Date(0).toISOString(),
      payload: { transcript: normalized.normalized },
    });
    sessionManager.endSession(session.sessionId, action.message);
    eventBus.emit({
      eventId: "event-4",
      type: "session-completed",
      sessionId: session.sessionId,
      at: new Date(0).toISOString(),
      payload: { result: "ok" },
    });

    const endedSession = sessionManager.getSession(session.sessionId);
    expect(endedSession?.state).toBe("completed");
    expect(endedSession?.events.at(-1)?.type).toBe("session-ended");
    expect(emitted).toEqual([
      "session-created",
      "listening-started",
      "transcript-final",
      "session-completed",
    ]);
  });

  it("interruption flow: start -> interrupt -> resume -> complete", () => {
    const conversationManager = new InMemorySpeechConversationManager();
    const conversation = conversationManager.createConversation("conv-e2e-2");

    conversationManager.appendUserTurn(conversation.conversationId, "please continue");
    const interrupted = conversationManager.interruptConversation(
      conversation.conversationId,
      "barge-in",
    );
    expect(interrupted.state).toBe("interrupted");

    const resumed = conversationManager.resumeConversation(conversation.conversationId);
    expect(resumed.state).toBe("active");

    const completed = conversationManager.endConversation(conversation.conversationId);
    expect(completed.state).toBe("completed");
    expect(completed.endedAt).toBe(new Date(0).toISOString());
  });

  it("voice command flow handles stop, repeat, and open-settings", () => {
    const router = createDefaultSpeechActionRouter();

    const stop = router.route({ requestId: "req-stop", transcript: "stop" });
    const repeat = router.route({ requestId: "req-repeat", transcript: "repeat" });
    const settings = router.route({
      requestId: "req-settings",
      transcript: "open-settings",
    });

    expect(stop.action?.type).toBe("stop");
    expect(repeat.action?.type).toBe("repeat");
    expect(settings.action?.type).toBe("open-settings");
    expect(stop.handled && repeat.handled && settings.handled).toBe(true);
  });

  it("transcript normalization flow handles mixed text and preserves metadata", () => {
    const normalizer = new SpeechNormalizer();
    const conversationManager = new InMemorySpeechConversationManager();

    const normalized = normalizer.normalize("mera gold ka chart kholo", {
      domain: "trading",
      localeHint: "ur-PK",
    });

    expect(normalized.normalized).toBe("open my gold chart");
    expect(normalized.appliedRules.length).toBeGreaterThan(0);

    const conversation = conversationManager.createConversation("conv-e2e-3", {
      locale: "ur-PK",
      domain: "trading",
      metadata: { source: "voice", stage: "normalization" },
    });
    conversationManager.appendUserTurn(conversation.conversationId, normalized.normalized);

    const loaded = conversationManager.getConversation(conversation.conversationId);
    expect(loaded?.context.metadata).toEqual({
      source: "voice",
      stage: "normalization",
    });
    expect(loaded?.turns[0]?.text).toBe("open my gold chart");
  });

  it("failure flow covers invalid action, session, and conversation", () => {
    const emptyRegistryRouter = new SpeechActionRouter(new InMemorySpeechActionRegistry());
    const invalidAction = emptyRegistryRouter.route({
      requestId: "req-invalid",
      transcript: "help",
    });
    expect(invalidAction.handled).toBe(false);

    const sessionManager = new InMemorySpeechSessionManager();
    expect(() => sessionManager.updateState("missing-session", "processing")).toThrow(
      "Speech session not found: missing-session",
    );

    const conversationManager = new InMemorySpeechConversationManager();
    expect(() =>
      conversationManager.appendAssistantTurn("missing-conversation", "hello"),
    ).toThrow("Speech conversation not found: missing-conversation");
  });
});

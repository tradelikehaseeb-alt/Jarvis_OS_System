import { describe, expect, it } from "vitest";

import {
  InMemorySpeechActionRegistry,
  SpeechActionRouter,
  createDefaultSpeechActionRouter,
} from "../actions";

describe("speech actions", () => {
  it("routes static default command mapping", () => {
    const router = createDefaultSpeechActionRouter();
    const response = router.route({
      requestId: "req-1",
      transcript: "help",
      conversationId: "conv-1",
    });

    expect(response).toMatchObject({
      requestId: "req-1",
      handled: true,
      action: {
        type: "help",
        command: "help",
      },
    });
    expect(response.message).toContain("Supported commands");
  });

  it("returns deterministic unhandled response for unknown command", () => {
    const router = createDefaultSpeechActionRouter();
    const response = router.route({
      requestId: "req-2",
      transcript: "unknown-command",
    });
    expect(response).toEqual({
      requestId: "req-2",
      handled: false,
      message: "No speech action mapped for command: unknown-command",
    });
  });

  it("supports in-memory registry + router composition", () => {
    const registry = new InMemorySpeechActionRegistry();
    registry.register(
      {
        actionId: "action-stop",
        type: "stop",
        command: "stop",
        description: "Stop flow",
      },
      (action, request) => ({
        requestId: request.requestId,
        handled: true,
        action,
        message: "stopped",
      }),
    );

    const router = new SpeechActionRouter(registry);
    const response = router.route({
      requestId: "req-3",
      transcript: "STOP",
    });

    expect(response.handled).toBe(true);
    expect(response.action?.type).toBe("stop");
    expect(response.message).toBe("stopped");
    expect(registry.list().map((item) => item.action.command)).toEqual(["stop"]);
  });
});

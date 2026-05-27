import { describe, expect, it } from "vitest";

import { InMemoryTransportProvider } from "../in-memory-transport-provider";

describe("InMemoryTransportProvider", () => {
  it("publishes to subscribers and tracks sessions", () => {
    const provider = new InMemoryTransportProvider();
    const received: string[] = [];

    provider.openSession({
      streamSessionId: "stream-1",
      taskId: "task-1",
      userId: "user-1",
      sessionId: "session-1",
    });

    provider.subscribe("sub-1", (message) => {
      received.push(message.type);
    });

    provider.publish({
      type: "planning_started",
      streamSessionId: "stream-1",
      sessionId: "session-1",
      taskId: "task-1",
      userId: "user-1",
      message: "Planning started",
    });

    provider.publish({
      type: "execution_completed",
      streamSessionId: "stream-1",
      sessionId: "session-1",
      taskId: "task-1",
      userId: "user-1",
      message: "Done",
    });

    expect(received).toEqual(["planning_started", "execution_completed"]);
    expect(provider.getActiveSessions()).toHaveLength(0);
    expect(provider.getRecentMessages()).toHaveLength(2);
    expect(provider.getHealth().status).toBe("healthy");
  });

  it("unsubscribes handlers", () => {
    const provider = new InMemoryTransportProvider();
    const received: string[] = [];

    const unsubscribe = provider.subscribe("sub-1", (message) => {
      received.push(message.type);
    });

    provider.publish({
      type: "execution_started",
      streamSessionId: "stream-1",
      sessionId: "session-1",
      taskId: "task-1",
      userId: "user-1",
    });

    unsubscribe();
    provider.unsubscribe("sub-1");

    provider.publish({
      type: "failed",
      streamSessionId: "stream-1",
      sessionId: "session-1",
      taskId: "task-1",
      userId: "user-1",
    });

    expect(received).toEqual(["execution_started"]);
  });
});

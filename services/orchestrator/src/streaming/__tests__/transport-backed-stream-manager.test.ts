import { describe, expect, it } from "vitest";

import { TransportBackedStreamManager } from "../transport-backed-stream-manager";
import { createDefaultTransportRuntime } from "../../transport/create-default-transport-runtime";

describe("TransportBackedStreamManager", () => {
  it("delegates publish and subscribe to transport runtime", () => {
    const manager = new TransportBackedStreamManager(createDefaultTransportRuntime());
    const received: string[] = [];

    manager.openSession({
      streamSessionId: "stream-1",
      taskId: "task-1",
      userId: "user-1",
      sessionId: "session-1",
    });

    manager.subscribe({
      subscriberId: "sub-1",
      onEvent: (event) => received.push(event.type),
    });

    manager.publish({
      type: "conversation_updated",
      streamSessionId: "stream-1",
      sessionId: "session-1",
      taskId: "task-1",
      userId: "user-1",
      message: "Updated",
    });

    expect(received).toEqual(["conversation_updated"]);
    expect(manager.getActiveSessions()).toHaveLength(1);
  });
});

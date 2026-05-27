import { describe, expect, it } from "vitest";

import {
  createDefaultTransportRuntime,
  createLocalEventTransportRuntime,
} from "../create-default-transport-runtime";
import { TransportProviderRegistry } from "../transport-provider-registry";
import { InMemoryTransportProvider } from "../in-memory-transport-provider";
import { LocalEventTransportProvider } from "../local-event-transport-provider";

describe("TransportRuntime", () => {
  it("routes publish/subscribe through default provider", () => {
    const runtime = createDefaultTransportRuntime();
    const received: string[] = [];

    runtime.openSession({
      streamSessionId: "stream-1",
      taskId: "task-1",
      userId: "user-1",
      sessionId: "session-1",
    });

    runtime.subscribe("sub-1", (message) => {
      received.push(message.type);
    });

    runtime.publish({
      type: "memory_saved",
      streamSessionId: "stream-1",
      sessionId: "session-1",
      taskId: "task-1",
      userId: "user-1",
    });

    expect(received).toContain("memory_saved");
    expect(runtime.getHealth().providerId).toBe("in-memory");
    expect(runtime.getDefaultProviderId()).toBe("in-memory");
    runtime.unsubscribe("sub-1");
  });

  it("supports registry with multiple providers", () => {
    const registry = new TransportProviderRegistry(new InMemoryTransportProvider());
    registry.register(new LocalEventTransportProvider("/tmp/unused-events.json"));

    expect(registry.listProviderIds()).toEqual(["in-memory", "local-event"]);
    expect(registry.getHealth("local-event").providerId).toBe("local-event");
  });

  it("createLocalEventTransportRuntime uses local provider as default", () => {
    const runtime = createLocalEventTransportRuntime(
      "/tmp/jarvis-transport-runtime-test.json",
    );
    expect(runtime.getDefaultProviderId()).toBe("local-event");
    expect(runtime.listProviderIds()).toContain("in-memory");
  });
});

import { describe, expect, it } from "vitest";

import { InMemoryAgentRegistry } from "../in-memory-agent-registry";
import type { BaseAgent } from "../base-agent";
import type { AgentMetadata } from "../agent-metadata";

const stubAgent = (id: string): BaseAgent => ({
  metadata: {
    agentId: id,
    displayName: id,
    version: "0.0.0",
    capabilities: [],
    executionCapable: false,
  } satisfies AgentMetadata,
  execute: async () => ({
    taskId: "t",
    requestId: "r",
    agentId: id,
    success: true,
  }),
});

describe("InMemoryAgentRegistry", () => {
  it("registers and resolves agents", async () => {
    const registry = new InMemoryAgentRegistry();
    await registry.register(stubAgent("a1"));
    expect(await registry.resolve("a1")).toBeDefined();
    expect((await registry.list())).toHaveLength(1);
  });

  it("unregisters agents", async () => {
    const registry = new InMemoryAgentRegistry();
    await registry.register(stubAgent("a1"));
    expect(await registry.unregister("a1")).toBe(true);
    expect(await registry.resolve("a1")).toBeUndefined();
  });
});

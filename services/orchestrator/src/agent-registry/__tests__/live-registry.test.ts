import { describe, expect, it } from "vitest";
import {
  InMemoryAgentRegistry,
  type AgentMetadata,
} from "@jarvis/agents-shared";

import { LiveAgentRegistry, agentToRegistered } from "../live-registry";

describe("agentToRegistered", () => {
  it("maps valid metadata correctly", () => {
    const registered = agentToRegistered({
      metadata: {
        agentId: "hermes",
        displayName: "Hermes",
        version: "test",
        executionCapable: false,
        capabilities: [
          { id: "p", kind: "planning", description: "plan" },
        ],
      },
      execute: async () => ({
        taskId: "t",
        requestId: "r",
        agentId: "hermes",
        success: true,
      }),
    });

    expect(registered.agentId).toBe("hermes");
    expect(registered.capabilities).toContain("planning");
  });

  it("throws descriptive error for missing metadata agentId", () => {
    expect(() =>
      agentToRegistered({
        metadata: {
          agentId: "",
          displayName: "Broken",
          version: "test",
          executionCapable: false,
          capabilities: [
            { id: "p", kind: "planning", description: "plan" },
          ],
        },
        execute: async () => ({
          taskId: "t",
          requestId: "r",
          agentId: "broken",
          success: true,
        }),
      }),
    ).toThrow(/metadata\.agentId/);
  });
});

describe("LiveAgentRegistry", () => {
  it("lists and resolves registered live agents", async () => {
    const registry = new InMemoryAgentRegistry();
    await registry.register({
      metadata: {
        agentId: "openclaw-gateway",
        displayName: "OpenClaw",
        version: "test",
        executionCapable: true,
        capabilities: [
          { id: "e", kind: "execution", description: "exec" },
        ],
      },
      execute: async () => ({
        taskId: "t",
        requestId: "r",
        agentId: "openclaw-gateway",
        success: true,
      }),
    });

    const live = new LiveAgentRegistry(registry);
    const list = await live.list();
    expect(list[0]?.agentId).toBe("openclaw-gateway");
    expect(list[0]?.executionCapable).toBe(true);
    expect((await live.resolve("openclaw-gateway"))?.agentId).toBe(
      "openclaw-gateway",
    );
  });

  it("throws descriptive error when registry metadata is invalid", async () => {
    const badRegistry = {
      contractId: "agent-registry" as const,
      register: async () => undefined,
      unregister: async () => true,
      resolve: async () => undefined,
      list: async () =>
        [
          {
            agentId: "",
            displayName: "Broken",
            version: "x",
            executionCapable: false,
            capabilities: [],
          } as AgentMetadata,
        ] as const,
    };

    const live = new LiveAgentRegistry(badRegistry);
    await expect(live.list()).rejects.toThrow(/metadata\.agentId/);
  });
});

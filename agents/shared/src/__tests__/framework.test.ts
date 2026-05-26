import { describe, expect, it } from "vitest";
import type { TaskIntent } from "@jarvis/types";

import {
  AbstractBaseAgent,
  type AgentCapability,
  type AgentContext,
  type AgentMetadata,
  type AgentRegistryContract,
  type AgentResult,
  type AgentTask,
  type BaseAgent,
} from "../index";

const sampleCapability: AgentCapability = {
  id: "cap-plan",
  kind: "planning",
  description: "Task planning",
};

const sampleMetadata: AgentMetadata = {
  agentId: "test-agent",
  displayName: "Test Agent",
  version: "0.0.0",
  capabilities: [sampleCapability],
  executionCapable: false,
};

const sampleIntent: TaskIntent = {
  kind: "research",
  description: "Find information",
};

const sampleTask: AgentTask = {
  taskId: "task-1",
  requestId: "req-1",
  userId: "user-1",
  intent: sampleIntent,
};

const sampleContext: AgentContext = {
  contextRef: "ctx-1",
  userId: "user-1",
};

describe("agent framework contracts", () => {
  it("AgentTask aligns with TaskIntent", () => {
    expect(sampleTask.intent.kind).toBe("research");
  });

  it("BaseAgent is structurally implementable", async () => {
    const agent: BaseAgent = {
      metadata: sampleMetadata,
      execute: async () => ({
        taskId: sampleTask.taskId,
        requestId: sampleTask.requestId,
        agentId: sampleMetadata.agentId,
        success: true,
      }),
    };
    const result = await agent.execute(sampleTask, sampleContext);
    expect(result.success).toBe(true);
  });

  it("AbstractBaseAgent can be extended without business logic", async () => {
    class TestAgent extends AbstractBaseAgent {
      readonly metadata = sampleMetadata;

      execute(): Promise<AgentResult> {
        return Promise.resolve({
          taskId: sampleTask.taskId,
          requestId: sampleTask.requestId,
          agentId: this.metadata.agentId,
          success: true,
          payload: { stub: true },
        });
      }
    }

    const agent = new TestAgent();
    const result = await agent.execute(sampleTask, sampleContext);
    expect(result.payload).toEqual({ stub: true });
  });

  it("AgentRegistryContract is assignable", async () => {
    const agents = new Map<string, BaseAgent>();

    const registry: AgentRegistryContract = {
      contractId: "agent-registry",
      register: async (agent) => {
        agents.set(agent.metadata.agentId, agent);
      },
      unregister: async (agentId) => agents.delete(agentId),
      resolve: async (agentId) => agents.get(agentId),
      list: async () => [...agents.values()].map((a) => a.metadata),
    };

    const stubAgent: BaseAgent = {
      metadata: sampleMetadata,
      execute: async () => ({
        taskId: "t",
        requestId: "r",
        agentId: sampleMetadata.agentId,
        success: true,
      }),
    };

    await registry.register(stubAgent);
    expect((await registry.list())).toHaveLength(1);
    expect(await registry.resolve("test-agent")).toBe(stubAgent);
  });

  it("AgentContext documents memoryApiRef without local storage", () => {
    const ctx: AgentContext = {
      contextRef: "ctx-1",
      userId: "user-1",
      memoryApiRef: "memory-api-client-stub",
    };
    expect(ctx.memoryApiRef).toContain("memory");
  });
});

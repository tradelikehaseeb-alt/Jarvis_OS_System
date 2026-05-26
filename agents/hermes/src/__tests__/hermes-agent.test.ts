import { describe, expect, it } from "vitest";
import {
  InMemoryAgentRegistry,
  createDefaultSkillPipeline,
  SEARCH_SKILL_ID,
  type AgentContext,
  type AgentTask,
} from "@jarvis/agents-shared";

import {
  HermesAgent,
  HERMES_AGENT_ID,
  createHermesAgent,
  registerHermesAgent,
} from "../index";

const task: AgentTask = {
  taskId: "task-1",
  requestId: "req-1",
  userId: "user-1",
  intent: { kind: "plan", description: "Plan my week" },
};

const context: AgentContext = {
  contextRef: "ctx-1",
  userId: "user-1",
};

describe("HermesAgent", () => {
  it("exposes required capabilities in metadata", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(skillExecutor);
    const kinds = agent.metadata.capabilities.map((c) => c.kind);
    expect(kinds).toContain("planning");
    expect(kinds).toContain("memory-access");
    expect(agent.metadata.executionCapable).toBe(false);
  });

  it("execute runs skill via SkillExecutor", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(skillExecutor);
    const result = await agent.execute(task, context);
    expect(result.success).toBe(true);
    expect(result.payload?.skillExecution).toBeDefined();
    expect(
      (result.payload?.skillExecution as { skillId: string }).skillId,
    ).toBe(SEARCH_SKILL_ID);
  });

  it("registers via AgentRegistryContract", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const registry = new InMemoryAgentRegistry();
    await registerHermesAgent(registry, skillExecutor);
    expect(await registry.resolve(HERMES_AGENT_ID)).toBeInstanceOf(HermesAgent);
  });
});

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
  createHermesPlanningAdapter,
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

  it("execute runs adapter then skill via SkillExecutor", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(skillExecutor);
    const result = await agent.execute(task, context);
    expect(result.success).toBe(true);
    expect(result.payload?.adapter).toBeDefined();
    expect(result.payload?.gateway).toBeDefined();
    expect((result.payload?.adapter as { stub: boolean }).stub).toBe(true);
    expect(result.payload?.plan).toBeDefined();
    expect(result.payload?.skillExecution).toBeDefined();
    expect(
      (result.payload?.skillExecution as { skillId: string }).skillId,
    ).toBe(SEARCH_SKILL_ID);
  });

  it("execute with HermesPlanningAdapter returns structured plan (Phase 22)", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(
      skillExecutor,
      createHermesPlanningAdapter(),
    );
    const result = await agent.execute(task, context);

    expect(result.success).toBe(true);
    expect(result.payload?.stub).toBe(false);
    const structured = result.payload?.structuredPlan as {
      goal: string;
      steps: string[];
    };
    expect(structured.goal).toBe("Plan my week");
    expect(structured.steps.length).toBeGreaterThanOrEqual(3);
    expect(result.payload?.memoryAccess).toBe("memory-service-api");
  });

  it("registers via AgentRegistryContract", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const registry = new InMemoryAgentRegistry();
    await registerHermesAgent(registry, skillExecutor);
    expect(await registry.resolve(HERMES_AGENT_ID)).toBeInstanceOf(HermesAgent);
  });
});

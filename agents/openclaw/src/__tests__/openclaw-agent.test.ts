import { describe, expect, it } from "vitest";
import {
  InMemoryAgentRegistry,
  createDefaultSkillPipeline,
  BROWSER_SKILL_ID,
  FILE_SKILL_ID,
  type AgentContext,
  type AgentTask,
} from "@jarvis/agents-shared";

import {
  OPENCLAW_AGENT_ID,
  OpenClawAgent,
  createOpenClawAgent,
  registerOpenClawAgent,
} from "../index";

const task: AgentTask = {
  taskId: "task-2",
  requestId: "req-2",
  userId: "user-1",
  intent: { kind: "automate", description: "Open app" },
  workflowStepId: "stub-execute",
};

const context: AgentContext = {
  contextRef: "ctx-2",
  userId: "user-1",
};

describe("OpenClawAgent", () => {
  it("exposes execution capabilities", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createOpenClawAgent(skillExecutor);
    const kinds = agent.metadata.capabilities.map((c) => c.kind);
    expect(kinds).toContain("execution");
    expect(agent.metadata.executionCapable).toBe(true);
  });

  it("execute runs adapter then BrowserSkill and FileSkill", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createOpenClawAgent(skillExecutor);
    const result = await agent.execute(task, context);
    expect(result.success).toBe(true);
    expect(result.payload?.adapter).toBeDefined();
    expect((result.payload?.adapter as { stub: boolean }).stub).toBe(true);
    expect(result.payload?.browser).toBeDefined();
    expect(result.payload?.file).toBeDefined();
    const executions = result.payload?.skillExecutions as { skillId: string }[];
    expect(executions.map((e) => e.skillId).sort()).toEqual(
      [BROWSER_SKILL_ID, FILE_SKILL_ID].sort(),
    );
  });

  it("registers via AgentRegistryContract", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const registry = new InMemoryAgentRegistry();
    await registerOpenClawAgent(registry, skillExecutor);
    expect(await registry.resolve(OPENCLAW_AGENT_ID)).toBeInstanceOf(OpenClawAgent);
  });
});

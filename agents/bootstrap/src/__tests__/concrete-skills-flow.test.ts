import { describe, expect, it } from "vitest";
import type { AgentContext, AgentTask } from "@jarvis/agents-shared";

import { registerDefaultAgents } from "../index";

const researchTask: AgentTask = {
  taskId: "task-flow-1",
  requestId: "req-flow-1",
  userId: "user-1",
  intent: { kind: "research", description: "Find API docs" },
};

const automateTask: AgentTask = {
  taskId: "task-flow-2",
  requestId: "req-flow-2",
  userId: "user-1",
  intent: { kind: "automate", description: "Open dashboard" },
};

const context: AgentContext = {
  contextRef: "ctx-flow",
  userId: "user-1",
};

describe("concrete skills end-to-end flow", () => {
  it("Hermes → SearchSkill via SkillExecutor", async () => {
    const { hermes } = await registerDefaultAgents();
    const result = await hermes.execute(researchTask, context);
    expect(result.success).toBe(true);
    expect(result.payload?.search).toBeDefined();
    const results = (result.payload?.search as { results: unknown[] }).results;
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("OpenClaw → BrowserSkill + FileSkill", async () => {
    const { openClaw } = await registerDefaultAgents();
    const result = await openClaw.execute(automateTask, context);
    expect(result.success).toBe(true);
    expect(result.payload?.browser).toBeDefined();
    expect(result.payload?.file).toBeDefined();
    expect(result.payload?.skillExecutions).toHaveLength(2);
  });
});

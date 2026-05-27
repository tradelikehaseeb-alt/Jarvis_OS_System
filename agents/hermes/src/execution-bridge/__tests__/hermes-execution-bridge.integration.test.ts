import { describe, expect, it } from "vitest";
import {
  InMemoryAgentRegistry,
  createDefaultSkillPipeline,
  type AgentContext,
} from "@jarvis/agents-shared";

import {
  createDefaultHermesExecutionBridge,
  createHermesAgent,
  HERMES_AGENT_ID,
} from "../../index";

describe("HermesExecutionBridge integration", () => {
  it("materializes OpenClaw tasks from Hermes agent planning output", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createHermesAgent(skillExecutor);
    const registry = new InMemoryAgentRegistry();
    await registry.register(agent);

    const context: AgentContext = {
      contextRef: "ctx-bridge",
      userId: "user-1",
    };

    const planningResult = await agent.execute(
      {
        taskId: "task-bridge",
        requestId: "req-bridge",
        userId: "user-1",
        intent: { kind: "automate", description: "Sync CRM contacts" },
      },
      context,
    );

    expect(planningResult.success).toBe(true);
    expect(planningResult.agentId).toBe(HERMES_AGENT_ID);

    const bridge = createDefaultHermesExecutionBridge();
    const plan = bridge.createExecutionPlan({
      parentTaskId: "task-bridge",
      agentPayload: planningResult.payload as Readonly<Record<string, unknown>>,
    });

    const tasks = bridge.mapPlanToTasks({
      plan,
      parentTaskId: "task-bridge",
      userId: "user-1",
      correlationId: "corr-bridge",
    });

    expect(plan.steps.length).toBeGreaterThan(0);
    expect(tasks.length).toBe(plan.steps.length);
    expect(tasks[0]?.intent.description).toContain("Sync CRM contacts");
  });
});

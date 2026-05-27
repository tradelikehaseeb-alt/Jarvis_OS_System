import { describe, expect, it } from "vitest";

import { createDefaultSkillPipeline } from "@jarvis/agents-shared";
import { createOpenClawAgent } from "@jarvis/openclaw";

describe("Orchestrator browser runtime integration", () => {
  it("agent execute includes browser runtime result in payload", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const agent = createOpenClawAgent(skillExecutor);
    const result = await agent.execute(
      {
        taskId: "task-browser-orchestrator-1",
        requestId: "req-browser-orchestrator-1",
        userId: "user-1",
        intent: { kind: "automate", description: "Open dashboard" },
        workflowStepId: "step-1",
      },
      { contextRef: "ctx-browser-1", userId: "user-1" },
    );

    expect(result.success).toBe(true);
    expect(result.payload?.browserRuntime).toMatchObject({
      success: true,
      stub: true,
      status: "completed",
    });
    expect(result.payload?.browser).toBeDefined();
  });
});

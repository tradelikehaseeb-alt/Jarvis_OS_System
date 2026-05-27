import { describe, expect, it } from "vitest";

import { createDefaultJarvisExecutionFlow } from "../create-default-jarvis-execution-flow";

describe("JarvisExecutionFlow integration", () => {
  it("runs automate intent through Hermes planning and OpenClaw execution", async () => {
    const flow = await createDefaultJarvisExecutionFlow();
    const result = await flow.executeFlow({
      rawInput: "Please automate opening the dashboard workflow",
      conversationId: "conv-e2e-automate",
    });

    const summary = flow.getExecutionSummary(result);

    expect(result.record.createTaskResponse.status).toBe("completed");
    expect(result.taskIntent.kind).toBe("automate");
    expect(result.classification?.intent).toBe("automate");
    expect(summary.handshake).toBe(true);
    expect(summary.lifecycleState).toBe("completed");
    expect(result.streamEvents).toContain("planning_started");
    expect(result.streamEvents).toContain("planning_completed");
    expect(result.streamEvents).toContain("execution_completed");
    expect(result.streamEvents).toContain("memory_saved");
    expect(result.steps.some((s) => s.step === "hermes_planning")).toBe(true);
    expect(result.steps.some((s) => s.step === "openclaw_execution")).toBe(true);
    expect(result.uiProjection.agentStatus.openClaw).toBe("completed");
  });

  it("runs plan intent through Hermes planning only", async () => {
    const flow = await createDefaultJarvisExecutionFlow();
    const result = await flow.executeFlow({
      rawInput: "Plan my week schedule",
      conversationId: "conv-e2e-plan",
      skipSpeechNormalization: true,
    });

    const summary = flow.getExecutionSummary(result);

    expect(result.taskIntent.kind).toBe("plan");
    expect(summary.handshake).toBe(false);
    expect(result.streamEvents).toContain("planning_started");
    expect(result.uiProjection.agentStatus.hermes).toBe("completed");
    expect(
      result.record.taskStatus.output?.planningPayload,
    ).toBeUndefined();
  });
});

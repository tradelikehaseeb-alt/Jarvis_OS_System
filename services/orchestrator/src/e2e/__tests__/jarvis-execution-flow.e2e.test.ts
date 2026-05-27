import { describe, expect, it } from "vitest";

import { createDefaultJarvisExecutionFlow } from "../create-default-jarvis-execution-flow";

describe("JarvisExecutionFlow e2e", () => {
  it("normalizes speech transcript before intent classification and execution", async () => {
    const flow = await createDefaultJarvisExecutionFlow();
    const result = await flow.executeFlow({
      rawInput: "  plan   my   sprint   roadmap  ",
      conversationId: "conv-e2e-speech",
    });

    expect(result.normalization).toBeDefined();
    expect(result.normalization?.normalized).toBe("plan my sprint roadmap");
    expect(result.steps.some((s) => s.step === "speech_normalized")).toBe(true);
    expect(result.classification?.ruleId).toBe("plan-keywords");
    expect(result.record.createTaskResponse.status).toBe("completed");

    const summary = flow.getExecutionSummary(result);
    expect(summary.completed).toBe(true);
    expect(summary.responseMessage.length).toBeGreaterThan(0);
  });

  it("records full step chain from input to response", async () => {
    const flow = await createDefaultJarvisExecutionFlow();
    const result = await flow.executeFlow({
      rawInput: "research competitor analysis",
      conversationId: "conv-e2e-chain",
    });

    const stepIds = result.steps.map((s) => s.step);

    expect(stepIds[0]).toBe("input_received");
    expect(stepIds).toContain("intent_classified");
    expect(stepIds).toContain("task_submitted");
    expect(stepIds).toContain("lifecycle_completed");
    expect(stepIds).toContain("memory_persisted");
    expect(result.uiProjection.activityEvents.length).toBeGreaterThan(0);
  });
});

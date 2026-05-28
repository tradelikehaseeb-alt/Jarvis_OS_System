import { describe, expect, it } from "vitest";

import {
  createDefaultWorkflowExecutionEngine,
  createDefaultOrchestratorExecutionSafetyRuntime,
} from "../index";

describe("WorkflowExecutionEngine", () => {
  it("builds Gmail summarize workflow from voice-like intent", () => {
    const engine = createDefaultWorkflowExecutionEngine();
    const workflow = engine.buildWorkflowFromIntent({
      kind: "automate",
      description: "Jarvis, open Gmail and summarize unread emails",
    });

    expect(workflow).toBeDefined();
    expect(workflow!.steps.length).toBeGreaterThanOrEqual(2);
    expect(workflow!.steps[0]?.url).toContain("mail.google.com");
    expect(workflow!.steps.some((step) => step.action === "extract-content")).toBe(true);
  });

  it("tracks workflow progress", () => {
    const engine = createDefaultWorkflowExecutionEngine();
    const workflow = engine.buildWorkflowFromIntent({
      kind: "automate",
      description: "Open dashboard",
    })!;

    const progress = engine.summarizeProgress(workflow, 1);
    expect(progress[0]?.completed).toBe(true);
    expect(progress[1]?.completed).toBe(false);
  });
});

describe("ExecutionSafetyRuntime", () => {
  it("blocks looped actions", () => {
    const safety = createDefaultOrchestratorExecutionSafetyRuntime();
    const startedAt = new Date().toISOString();

    for (let index = 0; index < 6; index += 1) {
      safety.beforeStep({
        stepCount: index + 1,
        startedAt,
        actionKey: "click:button",
      });
    }

    const decision = safety.beforeStep({
      stepCount: 7,
      startedAt,
      actionKey: "click:button",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.loopDetected).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { createDefaultVoiceExecutionRuntime } from "../create-default-voice-execution-runtime";

describe("VoiceExecutionRuntime", () => {
  it("normalizes voice input through speech pipeline", async () => {
    const runtime = createDefaultVoiceExecutionRuntime();
    const executionId = runtime.startVoiceExecution({
      requestId: "req-voice-1",
      rawInput: "for eggs analysis",
    });

    const result = await runtime.processVoiceInput({
      requestId: "req-voice-1",
      rawInput: "for eggs analysis",
      executionId,
    });

    expect(result.success).toBe(true);
    expect(result.normalizedInput).toBe("forex analysis");
    expect(result.speechMetadata?.normalizationApplied).toBe(true);
  });

  it("executes task delegate when configured", async () => {
    const runtime = createDefaultVoiceExecutionRuntime({
      taskExecutor: async (input) => ({
        taskId: "task-voice-1",
        classification: {
          intent: "plan",
          ruleId: "plan-keywords",
        },
        taskStatus: { status: "completed" },
      }),
    });

    const result = await runtime.processVoiceInput({
      requestId: "req-voice-2",
      rawInput: "Plan my week",
    });

    expect(result.success).toBe(true);
    expect(result.taskId).toBe("task-voice-1");
    expect(result.classification?.intent).toBe("plan");
  });

  it("stopVoiceExecution aborts active execution", async () => {
    const runtime = createDefaultVoiceExecutionRuntime({
      taskExecutor: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { taskId: "task-late" };
      },
    });

    const executionId = runtime.startVoiceExecution({
      requestId: "req-voice-3",
      rawInput: "Plan sprint",
    });
    runtime.stopVoiceExecution(executionId);

    const result = await runtime.processVoiceInput({
      requestId: "req-voice-3",
      rawInput: "Plan sprint",
      executionId,
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("EXECUTION_STOPPED");
  });
});

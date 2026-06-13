import { describe, expect, it } from "vitest";

import {
  enforceAutomationTerminalConfirmation,
  hasAutomationTerminalConfirmation,
  isConversationalPlanningFiller,
} from "../automation-terminal-confirmation";
import {
  TaskExecutionQueue,
  shouldExecuteTaskSynchronously,
} from "../task-execution-queue";

describe("task-execution-queue", () => {
  it("runs jobs concurrently up to maxConcurrency", async () => {
    const queue = new TaskExecutionQueue({ maxConcurrency: 2 });
    let active = 0;
    let maxActive = 0;

    const job = () =>
      new Promise<void>((resolve) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        setTimeout(() => {
          active -= 1;
          resolve();
        }, 30);
      });

    queue.enqueue({ taskId: "t1", run: job });
    queue.enqueue({ taskId: "t2", run: job });
    queue.enqueue({ taskId: "t3", run: job });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(maxActive).toBeGreaterThanOrEqual(2);
    expect(queue.getPendingCount()).toBe(0);
  });

  it("forces sync execution in test env", () => {
    expect(shouldExecuteTaskSynchronously({ NODE_ENV: "test" })).toBe(true);
    expect(
      shouldExecuteTaskSynchronously({
        NODE_ENV: "production",
        ORCHESTRATOR_SYNC_TASK_EXECUTION: "true",
      }),
    ).toBe(true);
  });
});

describe("automation-terminal-confirmation", () => {
  it("detects conversational planning filler", () => {
    expect(isConversationalPlanningFiller("Enabled toolsets safe,windows_automation")).toBe(
      true,
    );
    expect(
      isConversationalPlanningFiller('{"success": true, "exit_code": 0, "message": "done"}'),
    ).toBe(false);
  });

  it("accepts execute_dynamic_windows_script JSON confirmation", () => {
    const agentResult = {
      taskId: "task-1",
      requestId: "req-1",
      agentId: "hermes",
      success: true,
      payload: {
        toolOutput:
          '{"success": true, "exit_code": 0, "stderr": "", "message": "Folder created"}',
      },
    };
    expect(hasAutomationTerminalConfirmation(agentResult)).toBe(true);
  });

  it("rejects success without terminal confirmation for automate intents", () => {
    const agentResult = {
      taskId: "task-1",
      requestId: "req-1",
      agentId: "hermes",
      success: true,
      payload: {
        summary: "Enabled toolsets safe,windows_automation,file",
      },
    };
    const enforced = enforceAutomationTerminalConfirmation({
      intent: { kind: "automate", description: "taskkill chrome" },
      agentResult,
    });
    expect(enforced.success).toBe(false);
    expect(enforced.error?.code).toBe("AUTOMATION_TERMINAL_MISSING");
  });
});

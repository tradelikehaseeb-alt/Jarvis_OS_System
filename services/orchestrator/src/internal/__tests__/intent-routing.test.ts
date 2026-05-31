import { describe, expect, it } from "vitest";

import { detectRoutedIntentKind, buildWorkflowStepsForTask } from "../intent-routing";
import { sampleUserTask } from "../../__tests__/fixtures";

describe("intent-routing", () => {
  it("detects research from natural language", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "Find latest AI news" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("research");
  });

  it("detects browse from open/click verbs", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "Open Gmail inbox" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("browse");
  });

  it("detects file operations from transcript", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "Read file notes.txt in workspace" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("file");
    const steps = buildWorkflowStepsForTask(task);
    expect(steps.some((step) => step.skillId === "file-skill")).toBe(true);
  });

  it("detects cron from schedule verbs", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "Remind me every Monday" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("cron");
  });

  it("builds automate workflow with Hermes then OpenClaw", () => {
    const task = sampleUserTask({
      intent: { kind: "automate", description: "Export report" },
    });
    const steps = buildWorkflowStepsForTask(task);
    expect(steps.map((s) => s.agentId)).toEqual(["hermes", "openclaw-gateway"]);
  });
});

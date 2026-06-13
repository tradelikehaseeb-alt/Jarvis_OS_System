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

  it("detects browse from explicit browser automation phrases", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "Open website gmail.com and click on screen" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("browse");
  });

  it("routes voice UI phrases to chat, not OpenClaw", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "voice button per click krha hu" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("chat");
    const steps = buildWorkflowStepsForTask(task);
    expect(steps.every((step) => step.agentId !== "openclaw-gateway")).toBe(true);
  });

  it("routes microphone and record phrases to chat", () => {
    expect(
      detectRoutedIntentKind({
        kind: "chat",
        description: "microphone record sun bol",
      }),
    ).toBe("chat");
  });

  it("detects file operations from transcript", () => {
    const task = sampleUserTask({
      intent: { kind: "chat", description: "Read file notes.txt in workspace" },
    });
    expect(detectRoutedIntentKind(task.intent)).toBe("file");
    const steps = buildWorkflowStepsForTask(task);
    expect(steps.some((step) => step.skillId === "file-skill")).toBe(true);
  });

  it("routes developer and media execution directly to Hermes tools", () => {
    const task = sampleUserTask({
      intent: {
        kind: "automate",
        description: "Is video ko edit karo with ffmpeg",
      },
    });

    expect(detectRoutedIntentKind(task.intent)).toBe("local-execution");
    expect(buildWorkflowStepsForTask(task)).toEqual([
      expect.objectContaining({
        stepId: "hermes-local-execute",
        agentId: "hermes",
      }),
    ]);
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

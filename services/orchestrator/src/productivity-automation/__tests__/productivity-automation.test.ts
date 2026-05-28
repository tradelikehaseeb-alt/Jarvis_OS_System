import { describe, expect, it } from "vitest";

import {
  createDefaultCommunicationAutomationRuntime,
  createDefaultDailyAssistantRuntime,
  createDefaultPersonalContextRuntime,
  createDefaultProductivityWorkflowRuntime,
  createDefaultResearchAutomationRuntime,
  createDefaultSmartSchedulingRuntime,
  createDefaultTaskPlanningRuntime,
} from "../index";

describe("TaskPlanningRuntime", () => {
  it("organizes tasks for today from natural language", () => {
    const runtime = createDefaultTaskPlanningRuntime();
    const plan = runtime.buildPlan("organize my tasks for today");

    expect(plan?.tasks.length).toBeGreaterThan(0);
    expect(plan?.tasks[0]?.userLabel).toMatch(/Organizing|Reviewing|Researching/);
  });
});

describe("CommunicationAutomationRuntime", () => {
  it("summarizes unread emails workflow", () => {
    const runtime = createDefaultCommunicationAutomationRuntime();
    const result = runtime.run("summarize unread emails and prepare my priorities");

    expect(result.steps.some((step) => step.userLabel.includes("email"))).toBe(true);
    expect(result.summary).toContain("Communication");
  });
});

describe("ResearchAutomationRuntime", () => {
  it("prepares trading research workspace", () => {
    const runtime = createDefaultResearchAutomationRuntime();
    const result = runtime.run("prepare my trading research workspace");

    expect(result.steps.some((step) => step.userLabel.includes("workspace"))).toBe(true);
    expect(result.summary).toContain("workspace");
  });
});

describe("SmartSchedulingRuntime", () => {
  it("handles meeting summary requests", () => {
    const runtime = createDefaultSmartSchedulingRuntime();
    expect(runtime.matches("prepare a meeting summary")).toBe(true);
  });
});

describe("PersonalContextRuntime", () => {
  it("remembers project direction", () => {
    const runtime = createDefaultPersonalContextRuntime();
    const snapshot = runtime.rememberProjectDirection(
      "user-1",
      "focus on AI trading signals",
    );

    expect(snapshot.projectNotes.length).toBe(1);
    expect(snapshot.projectNotes[0]).toContain("AI trading");
  });
});

describe("DailyAssistantRuntime", () => {
  it("builds proactive suggestions", () => {
    const runtime = createDefaultDailyAssistantRuntime();
    const suggestions = runtime.buildSuggestions("summarize unread emails");

    expect(suggestions.length).toBeGreaterThan(0);
  });
});

describe("ProductivityWorkflowRuntime", () => {
  it("coordinates daily productivity without exposing internal names", async () => {
    const runtime = createDefaultProductivityWorkflowRuntime();
    const result = await runtime.run({
      description: "summarize unread emails and prepare my priorities",
      intentKind: "plan",
      userId: "user-prod-1",
      conversationId: "conv-prod-1",
    });

    expect(result.success).toBe(true);
    expect(result.activities.length).toBeGreaterThan(0);
    expect(result.activities.every((entry) => !entry.userLabel.includes("Hermes"))).toBe(
      true,
    );
    expect(result.activities.every((entry) => !entry.userLabel.includes("OpenClaw"))).toBe(
      true,
    );
  });

  it("remembers project direction", async () => {
    const runtime = createDefaultProductivityWorkflowRuntime();
    const result = await runtime.run({
      description: "remember this project direction: ship Phase 98 productivity",
      intentKind: "plan",
      userId: "user-prod-2",
    });

    expect(result.personalContext?.projectNotes.length).toBeGreaterThan(0);
  });
});

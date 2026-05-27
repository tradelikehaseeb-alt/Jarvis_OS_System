import { describe, expect, it } from "vitest";

import { deriveAgentStatus } from "../../agent-status/derive-agent-status";
import { mapTaskStatusToActivityEvents } from "../../activity/map-task-status-events";
import { createDefaultJarvisExecutionFlow } from "@jarvis/orchestrator";

describe("Jarvis execution flow desktop integration", () => {
  it("connects orchestrator e2e flow to activity timeline and agent status", async () => {
    const flow = await createDefaultJarvisExecutionFlow();
    const result = await flow.executeFlow({
      rawInput: "automate opening the dashboard workflow",
      conversationId: "conv-desktop-e2e",
      skipSpeechNormalization: true,
    });

    const activityEvents = mapTaskStatusToActivityEvents(
      result.record.taskStatus,
    );
    expect(activityEvents.length).toBeGreaterThan(0);
    expect(
      activityEvents.some(
        (event) =>
          event.kind === "planning_started" ||
          event.kind === "planning_completed",
      ),
    ).toBe(true);

    const agentStatus = deriveAgentStatus(activityEvents, false);
    expect(agentStatus.hermes).toBe("completed");
    expect(agentStatus.openClaw).toBe("completed");
    expect(agentStatus.displayMessage).toBe("Completed");
  });

  it("classifies and executes plan intent for Hermes-only path", async () => {
    const flow = await createDefaultJarvisExecutionFlow();
    const result = await flow.executeFlow({
      rawInput: "Plan my week",
      skipSpeechNormalization: true,
    });

    expect(result.classification?.intent).toBe("plan");
    const summary = flow.getExecutionSummary(result);
    expect(summary.completed).toBe(true);
    expect(summary.handshake).toBe(false);

    const activityEvents = mapTaskStatusToActivityEvents(
      result.record.taskStatus,
    );
    const agentStatus = deriveAgentStatus(activityEvents, false);
    expect(agentStatus.hermes).toBe("completed");
    expect(agentStatus.openClaw).not.toBe("executing");
    expect(agentStatus.openClaw).not.toBe("planning");
  });
});

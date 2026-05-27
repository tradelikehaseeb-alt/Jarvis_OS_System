import { describe, expect, it } from "vitest";

import { createTestOrchestratorService } from "../../index";
import { createDefaultConversationHistoryRuntime } from "../../conversation-history/create-default-conversation-history-runtime";
import { createDefaultMemoryRecallRuntime } from "../../memory-recall/create-default-memory-recall-runtime";
import { createDefaultConversationWorkspaceRuntime } from "../create-default-conversation-workspace-runtime";

describe("conversation workspace integration", () => {
  it("aligns workspace session with task execution timeline output", async () => {
    const conversationHistory = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });
    const workspace = createDefaultConversationWorkspaceRuntime({
      conversationHistoryRuntime: conversationHistory,
      memoryRecallRuntime: createDefaultMemoryRecallRuntime(),
    });

    const service = await createTestOrchestratorService();
    const session = workspace.createWorkspaceSession({
      userId: "user-api-stub",
      conversationId: "conv-workspace-1",
    });

    const { record } = await service.executeCreateTask({
      intent: { kind: "plan", description: "Plan workspace sprint" },
    });

    const executionTimeline = record.taskStatus.output?.executionTimeline as {
      timelineId?: string;
      events?: readonly unknown[];
    };

    expect(session.status).toBe("active");
    expect(executionTimeline.events?.length ?? 0).toBeGreaterThan(0);

    if (executionTimeline.timelineId) {
      workspace.linkTimeline(session.sessionId, executionTimeline.timelineId);
    }

    conversationHistory.saveConversation({
      conversationId: "conv-workspace-1",
      userId: "user-api-stub",
      role: "user",
      message: "Plan workspace sprint",
      taskId: record.taskStatus.taskId,
    });

    const refreshed = workspace.getWorkspaceSession(session.sessionId);
    expect(refreshed?.historyTurns).toHaveLength(1);
  });
});

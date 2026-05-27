import { describe, expect, it } from "vitest";

import {
  createDefaultConversationHistoryRuntime,
  createDefaultConversationWorkspaceRuntime,
  createDefaultMemoryRecallRuntime,
  createTestOrchestratorService,
} from "@jarvis/orchestrator";

describe("conversation workspace desktop integration", () => {
  it("builds workspace session from orchestrator conversation history", async () => {
    const conversationHistory = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });
    const workspace = createDefaultConversationWorkspaceRuntime({
      conversationHistoryRuntime: conversationHistory,
      memoryRecallRuntime: createDefaultMemoryRecallRuntime(),
    });

    const session = workspace.createWorkspaceSession({
      userId: "user-api-stub",
      conversationId: "conv-desktop-1",
    });

    const service = await createTestOrchestratorService();
    const { record } = await service.executeCreateTask({
      intent: { kind: "plan", description: "Workspace integration plan" },
    });

    conversationHistory.saveConversation({
      conversationId: "conv-desktop-1",
      userId: "user-api-stub",
      role: "user",
      message: "Workspace integration plan",
      taskId: record.taskStatus.taskId,
    });

    const refreshed = workspace.getWorkspaceSession(session.sessionId);
    expect(refreshed?.historyTurns.length).toBe(1);
    expect(record.taskStatus.output?.executionTimeline).toBeDefined();
  });
});

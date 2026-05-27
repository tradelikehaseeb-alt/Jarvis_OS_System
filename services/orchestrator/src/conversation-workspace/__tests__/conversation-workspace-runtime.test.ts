import { describe, expect, it } from "vitest";

import { createDefaultActivityRuntime } from "../../activity/create-default-activity-runtime";
import { createDefaultConversationHistoryRuntime } from "../../conversation-history/create-default-conversation-history-runtime";
import { createDefaultMemoryRecallRuntime } from "../../memory-recall/create-default-memory-recall-runtime";
import { createDefaultStreamManager } from "../../streaming/create-default-stream-manager";
import { createDefaultTimelineRuntime } from "../../timeline/create-default-timeline-runtime";

import { createDefaultConversationWorkspaceRuntime } from "../create-default-conversation-workspace-runtime";

describe("ConversationWorkspaceRuntime", () => {
  it("createWorkspaceSession returns active session with history and memories", () => {
    const conversationHistory = createDefaultConversationHistoryRuntime({
      useFileBackend: false,
    });
    conversationHistory.saveConversation({
      conversationId: "conv-ws-1",
      userId: "user-1",
      role: "user",
      message: "Plan my week",
      taskId: "task-1",
    });

    const workspace = createDefaultConversationWorkspaceRuntime({
      conversationHistoryRuntime: conversationHistory,
      memoryRecallRuntime: createDefaultMemoryRecallRuntime(),
    });

    const session = workspace.createWorkspaceSession({
      userId: "user-1",
      conversationId: "conv-ws-1",
    });

    expect(session.status).toBe("active");
    expect(session.historyTurns).toHaveLength(1);
    expect(session.historyTurns[0]?.message).toBe("Plan my week");
    expect(session.runtimeState.healthy).toBe(true);
  });

  it("archive and restore workspace session", () => {
    const workspace = createDefaultConversationWorkspaceRuntime({
      conversationHistoryRuntime: createDefaultConversationHistoryRuntime({
        useFileBackend: false,
      }),
      memoryRecallRuntime: createDefaultMemoryRecallRuntime(),
    });

    const created = workspace.createWorkspaceSession({ userId: "user-2" });
    const archived = workspace.archiveWorkspaceSession(created.sessionId);
    expect(archived?.status).toBe("archived");

    const restored = workspace.restoreWorkspaceSession(created.sessionId);
    expect(restored?.status).toBe("active");
  });

  it("includes timeline events when timeline runtime linked", () => {
    const streamManager = createDefaultStreamManager();
    const activityRuntime = createDefaultActivityRuntime({ streamManager });
    const timelineRuntime = createDefaultTimelineRuntime({ activityRuntime });

    const workspace = createDefaultConversationWorkspaceRuntime({
      conversationHistoryRuntime: createDefaultConversationHistoryRuntime({
        useFileBackend: false,
      }),
      memoryRecallRuntime: createDefaultMemoryRecallRuntime(),
      timelineRuntime,
    });

    const session = workspace.createWorkspaceSession({
      userId: "user-3",
      timelineId: "stream-task-1",
    });

    timelineRuntime.startTimeline({
      timelineId: "stream-task-1",
      streamSessionId: "stream-task-1",
      taskId: "task-1",
    });

    streamManager.publish({
      streamSessionId: "stream-task-1",
      sessionId: "sess-1",
      taskId: "task-1",
      userId: "user-3",
      type: "planning_started",
      message: "Planning",
      payload: { source: "hermes" },
    });

    const refreshed = workspace.getWorkspaceSession(session.sessionId);
    expect(refreshed?.timelineEvents.some((e) => e.kind === "planning_started")).toBe(
      true,
    );
  });
});

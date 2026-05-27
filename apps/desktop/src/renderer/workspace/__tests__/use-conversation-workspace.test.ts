import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useConversationWorkspace } from "../use-conversation-workspace";

describe("useConversationWorkspace", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates and selects workspace sessions", () => {
    const { result } = renderHook(() => useConversationWorkspace());

    expect(result.current.activeSession.status).toBe("active");

    act(() => {
      result.current.createWorkspaceSession();
    });

    expect(result.current.sessions.length).toBeGreaterThan(1);
  });

  it("syncs history and memories from task status", () => {
    const { result } = renderHook(() => useConversationWorkspace());

    act(() => {
      result.current.syncWorkspaceFromTask(
        {
          taskId: "task-1",
          status: "completed",
          updatedAt: "2026-05-27T12:00:00.000Z",
          output: {
            memory: { summary: "Saved summary", historyCount: 2 },
            memoryRecall: { count: 1, source: "conversation-history" },
            executionLifecycle: { state: "completed" },
          },
        },
        [
          {
            id: "m-1",
            role: "user",
            text: "Hello",
          },
        ],
      );
    });

    expect(result.current.activeSession.historyTurns).toHaveLength(1);
    expect(result.current.activeSession.relatedMemories.length).toBeGreaterThan(0);
    expect(result.current.activeSession.runtimeState.phase).toBe("completed");
  });
});

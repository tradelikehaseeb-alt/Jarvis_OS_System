import { useCallback, useMemo, useState } from "react";
import type { TaskStatusResponse } from "@jarvis/types";

import type { ChatMessage } from "../components/ChatMessages";
import { useExecutionTimeline } from "../timeline";

import type { StoredWorkspaceSession, WorkspaceSessionView } from "./workspace-types";
import {
  buildSessionView,
  createStoredSession,
  deriveRuntimeState,
  extractRelatedMemories,
  loadInitialWorkspaceState,
  messagesToHistoryTurns,
  saveActiveSessionId,
  saveStoredSessions,
} from "./workspace-storage";

export interface UseConversationWorkspaceResult {
  readonly activeSession: WorkspaceSessionView;
  readonly sessions: readonly WorkspaceSessionView[];
  readonly timeline: ReturnType<typeof useExecutionTimeline>;
  readonly createWorkspaceSession: () => WorkspaceSessionView;
  readonly restoreWorkspaceSession: (sessionId: string) => void;
  readonly archiveWorkspaceSession: (sessionId: string) => void;
  readonly selectWorkspaceSession: (sessionId: string) => void;
  readonly syncWorkspaceFromTask: (
    status: TaskStatusResponse | null,
    messages: readonly ChatMessage[],
  ) => void;
}

export function useConversationWorkspace(): UseConversationWorkspaceResult {
  const timeline = useExecutionTimeline();
  const [initialWorkspace] = useState(loadInitialWorkspaceState);
  const [storedSessions, setStoredSessions] = useState<StoredWorkspaceSession[]>(
    () => initialWorkspace.storedSessions,
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => initialWorkspace.activeSessionId,
  );
  const [historyTurns, setHistoryTurns] = useState<WorkspaceSessionView["historyTurns"]>(
    [],
  );
  const [relatedMemories, setRelatedMemories] = useState<
    WorkspaceSessionView["relatedMemories"]
  >([]);
  const [runtimeState, setRuntimeState] = useState<WorkspaceSessionView["runtimeState"]>(
    {
      phase: "ready",
      healthy: true,
      message: "Runtime ready",
    },
  );

  const persistSessions = useCallback((next: StoredWorkspaceSession[]) => {
    setStoredSessions(next);
    saveStoredSessions(next);
  }, []);

  const buildView = useCallback(
    (stored: StoredWorkspaceSession): WorkspaceSessionView =>
      buildSessionView(
        stored,
        stored.sessionId === activeSessionId ? historyTurns : [],
        stored.sessionId === activeSessionId ? relatedMemories : [],
        stored.sessionId === activeSessionId ? timeline.steps : [],
        stored.sessionId === activeSessionId
          ? runtimeState
          : { phase: stored.status, healthy: true },
      ),
    [activeSessionId, historyTurns, relatedMemories, runtimeState, timeline.steps],
  );

  const sessions = useMemo(
    () => storedSessions.map((stored) => buildView(stored)),
    [buildView, storedSessions],
  );

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.sessionId === activeSessionId) ??
      buildView(storedSessions[0]!),
    [activeSessionId, buildView, sessions, storedSessions],
  );

  const createWorkspaceSession = useCallback(() => {
    const created = createStoredSession();
    const next = [created, ...storedSessions.filter((s) => s.status === "active")];
    persistSessions(next);
    setActiveSessionId(created.sessionId);
    saveActiveSessionId(created.sessionId);
    setHistoryTurns([]);
    setRelatedMemories([]);
    timeline.reset();
    return buildView(created);
  }, [buildView, persistSessions, storedSessions, timeline]);

  const restoreWorkspaceSession = useCallback(
    (sessionId: string) => {
      const next = storedSessions.map((session) =>
        session.sessionId === sessionId
          ? { ...session, status: "active" as const, updatedAt: new Date().toISOString() }
          : session,
      );
      persistSessions(next);
      setActiveSessionId(sessionId);
      saveActiveSessionId(sessionId);
    },
    [persistSessions, storedSessions],
  );

  const archiveWorkspaceSession = useCallback(
    (sessionId: string) => {
      const next = storedSessions.map((session) =>
        session.sessionId === sessionId
          ? { ...session, status: "archived" as const, updatedAt: new Date().toISOString() }
          : session,
      );
      persistSessions(next);

      if (activeSessionId === sessionId) {
        const fallback = next.find((session) => session.status === "active");
        if (fallback) {
          setActiveSessionId(fallback.sessionId);
          saveActiveSessionId(fallback.sessionId);
        }
      }
    },
    [activeSessionId, persistSessions, storedSessions],
  );

  const selectWorkspaceSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    saveActiveSessionId(sessionId);
  }, []);

  const syncWorkspaceFromTask = useCallback(
    (status: TaskStatusResponse | null, messages: readonly ChatMessage[]) => {
      setHistoryTurns(messagesToHistoryTurns(messages));
      setRelatedMemories(extractRelatedMemories(status));
      setRuntimeState(deriveRuntimeState(status));

      const next = storedSessions.map((session) =>
        session.sessionId === activeSessionId
          ? { ...session, updatedAt: new Date().toISOString() }
          : session,
      );
      persistSessions(next);
    },
    [activeSessionId, persistSessions, storedSessions],
  );

  return {
    activeSession,
    sessions,
    timeline,
    createWorkspaceSession,
    restoreWorkspaceSession,
    archiveWorkspaceSession,
    selectWorkspaceSession,
    syncWorkspaceFromTask,
  };
}

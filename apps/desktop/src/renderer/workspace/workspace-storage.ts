import type { TaskStatusResponse } from "@jarvis/types";

import type { ChatMessage } from "../components/ChatMessages";
import type { TimelineStep } from "../timeline/timeline-step";

import type {
  RelatedMemoryView,
  StoredWorkspaceSession,
  WorkspaceHistoryTurn,
  WorkspaceRuntimeView,
} from "./workspace-types";
import {
  WORKSPACE_ACTIVE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "./workspace-types";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadStoredSessions(): StoredWorkspaceSession[] {
  return readJson<StoredWorkspaceSession[]>(WORKSPACE_STORAGE_KEY, []);
}

export function saveStoredSessions(sessions: readonly StoredWorkspaceSession[]): void {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(sessions));
}

export function loadActiveSessionId(): string | undefined {
  return localStorage.getItem(WORKSPACE_ACTIVE_KEY) ?? undefined;
}

export function saveActiveSessionId(sessionId: string): void {
  localStorage.setItem(WORKSPACE_ACTIVE_KEY, sessionId);
}

export function createStoredSession(): StoredWorkspaceSession {
  const now = new Date().toISOString();
  const sessionId = `ws-${Date.now()}`;
  return {
    sessionId,
    conversationId: `conv-${sessionId}`,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

function ensureActiveSession(
  sessions: StoredWorkspaceSession[],
): StoredWorkspaceSession[] {
  if (sessions.length > 0) {
    return sessions;
  }
  return [createStoredSession()];
}

/** Load persisted sessions and resolve a single active session id (Phase 76). */
export function loadInitialWorkspaceState(): {
  readonly storedSessions: StoredWorkspaceSession[];
  readonly activeSessionId: string;
} {
  const storedSessions = ensureActiveSession(loadStoredSessions());
  const savedActiveId = loadActiveSessionId();
  const activeSessionId =
    savedActiveId &&
    storedSessions.some((session) => session.sessionId === savedActiveId)
      ? savedActiveId
      : storedSessions[0]!.sessionId;

  return { storedSessions, activeSessionId };
}

export function messagesToHistoryTurns(
  messages: readonly ChatMessage[],
): WorkspaceHistoryTurn[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      message: message.text,
      timestamp: new Date().toISOString(),
    }));
}

export function extractRelatedMemories(
  status: TaskStatusResponse | null,
): RelatedMemoryView[] {
  if (!status?.output) {
    return [];
  }

  const memories: RelatedMemoryView[] = [];
  const memory = status.output.memory as
    | { summary?: string; historyCount?: number }
    | undefined;

  if (memory?.summary) {
    memories.push({
      id: "memory-summary",
      content: memory.summary,
      source: "memory",
      score: 1,
    });
  }

  const context = status.output.context as { summary?: string } | undefined;
  if (context?.summary) {
    memories.push({
      id: "context-summary",
      content: context.summary,
      source: "context",
      score: 0.9,
    });
  }

  const recall = status.output.memoryRecall as
    | { count?: number; source?: string }
    | undefined;

  if (recall?.count) {
    memories.push({
      id: "memory-recall",
      content: `${recall.count} recalled memories`,
      source: recall.source ?? "memory-recall",
      score: 0.8,
    });
  }

  return memories;
}

export function deriveRuntimeState(
  status: TaskStatusResponse | null,
): WorkspaceRuntimeView {
  const lifecycle = status?.output?.executionLifecycle as
    | { state?: string }
    | undefined;

  if (!lifecycle?.state) {
    return {
      phase: status ? "executing" : "ready",
      healthy: status?.status !== "failed",
      message: status?.status ?? "Idle",
    };
  }

  return {
    phase: lifecycle.state,
    healthy: lifecycle.state !== "failed",
    message: `Lifecycle: ${lifecycle.state}`,
  };
}

export function buildSessionView(
  stored: StoredWorkspaceSession,
  historyTurns: readonly WorkspaceHistoryTurn[],
  relatedMemories: readonly RelatedMemoryView[],
  timelineSteps: readonly TimelineStep[],
  runtimeState: WorkspaceRuntimeView,
) {
  return {
    sessionId: stored.sessionId,
    conversationId: stored.conversationId,
    status: stored.status,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    historyTurns,
    relatedMemories,
    timelineSteps,
    runtimeState,
  };
}

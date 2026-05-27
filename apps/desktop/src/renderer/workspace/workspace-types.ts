import type { TimelineStep } from "../timeline/timeline-step";

export type WorkspaceSessionStatus = "active" | "archived";

export interface WorkspaceHistoryTurn {
  readonly role: string;
  readonly message: string;
  readonly timestamp: string;
  readonly taskId?: string;
}

export interface RelatedMemoryView {
  readonly id: string;
  readonly content: string;
  readonly source: string;
  readonly score?: number;
}

export interface WorkspaceRuntimeView {
  readonly phase: string;
  readonly healthy: boolean;
  readonly message?: string;
}

/**
 * Desktop workspace session view (Phase 76).
 */
export interface WorkspaceSessionView {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly status: WorkspaceSessionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly historyTurns: readonly WorkspaceHistoryTurn[];
  readonly relatedMemories: readonly RelatedMemoryView[];
  readonly timelineSteps: readonly TimelineStep[];
  readonly runtimeState: WorkspaceRuntimeView;
}

export interface StoredWorkspaceSession {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly status: WorkspaceSessionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const WORKSPACE_STORAGE_KEY = "jarvis.desktop.workspaceSessions";
export const WORKSPACE_ACTIVE_KEY = "jarvis.desktop.activeWorkspaceSession";

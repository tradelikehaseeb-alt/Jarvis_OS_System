import type { MemoryRecallRecord } from "../memory-recall/memory-recall-record";
import type { TimelineEvent } from "../timeline/timeline-event";

export type WorkspaceSessionStatus = "active" | "archived";

/**
 * Runtime health snapshot attached to a workspace session (Phase 76).
 */
export interface WorkspaceRuntimeState {
  readonly phase: string;
  readonly healthy: boolean;
  readonly message?: string;
}

export interface WorkspaceHistoryTurn {
  readonly role: string;
  readonly message: string;
  readonly timestamp: string;
  readonly taskId?: string;
}

/**
 * Persistent conversation workspace session (Phase 76).
 */
export interface WorkspaceSession {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly userId: string;
  readonly status: WorkspaceSessionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly historyTurns: readonly WorkspaceHistoryTurn[];
  readonly relatedMemories: readonly MemoryRecallRecord[];
  readonly timelineEvents: readonly TimelineEvent[];
  readonly runtimeState: WorkspaceRuntimeState;
}

export interface CreateWorkspaceSessionInput {
  readonly userId: string;
  readonly conversationId?: string;
  readonly timelineId?: string;
}

import type { ConversationHistoryRuntime } from "../conversation-history/conversation-history-runtime";
import type { MemoryRecallRuntime } from "../memory-recall/memory-recall-runtime";
import type { TimelineRuntime } from "../timeline/timeline-runtime";

import type { ConversationWorkspaceRuntime } from "./conversation-workspace-runtime";
import type {
  CreateWorkspaceSessionInput,
  WorkspaceHistoryTurn,
  WorkspaceRuntimeState,
  WorkspaceSession,
  WorkspaceSessionStatus,
} from "./workspace-session";

export interface CreateDefaultConversationWorkspaceRuntimeOptions {
  readonly conversationHistoryRuntime: ConversationHistoryRuntime;
  readonly memoryRecallRuntime: MemoryRecallRuntime;
  readonly timelineRuntime?: TimelineRuntime;
  readonly defaultRuntimeState?: WorkspaceRuntimeState;
}

interface StoredWorkspaceSession {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly userId: string;
  status: WorkspaceSessionStatus;
  readonly createdAt: string;
  updatedAt: string;
  timelineId?: string;
}

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `workspace-session-${sessionCounter}`;
}

function defaultRuntimeState(): WorkspaceRuntimeState {
  return {
    phase: "ready",
    healthy: true,
    message: "Runtime ready",
  };
}

class DefaultConversationWorkspaceRuntime implements ConversationWorkspaceRuntime {
  private readonly sessions = new Map<string, StoredWorkspaceSession>();

  constructor(private readonly options: CreateDefaultConversationWorkspaceRuntimeOptions) {}

  createWorkspaceSession(input: CreateWorkspaceSessionInput): WorkspaceSession {
    const now = new Date().toISOString();
    const sessionId = nextSessionId();
    const conversationId = input.conversationId ?? `conv-${sessionId}`;

    const stored: StoredWorkspaceSession = {
      sessionId,
      conversationId,
      userId: input.userId,
      status: "active",
      createdAt: now,
      updatedAt: now,
      timelineId: input.timelineId,
    };

    this.sessions.set(sessionId, stored);
    return this.buildSessionView(stored);
  }

  getWorkspaceSession(sessionId: string): WorkspaceSession | undefined {
    const stored = this.sessions.get(sessionId);
    if (!stored) {
      return undefined;
    }
    return this.buildSessionView(stored);
  }

  restoreWorkspaceSession(sessionId: string): WorkspaceSession | undefined {
    const stored = this.sessions.get(sessionId);
    if (!stored) {
      return undefined;
    }

    stored.status = "active";
    stored.updatedAt = new Date().toISOString();
    return this.buildSessionView(stored);
  }

  archiveWorkspaceSession(sessionId: string): WorkspaceSession | undefined {
    const stored = this.sessions.get(sessionId);
    if (!stored) {
      return undefined;
    }

    stored.status = "archived";
    stored.updatedAt = new Date().toISOString();
    return this.buildSessionView(stored);
  }

  /** Links a workspace session to a task execution timeline. */
  linkTimeline(sessionId: string, timelineId: string): void {
    const stored = this.sessions.get(sessionId);
    if (!stored) {
      return;
    }
    stored.timelineId = timelineId;
    stored.updatedAt = new Date().toISOString();
  }

  private buildSessionView(stored: StoredWorkspaceSession): WorkspaceSession {
    const history = this.options.conversationHistoryRuntime.getConversation(
      stored.conversationId,
      stored.userId,
    );

    const historyTurns: WorkspaceHistoryTurn[] =
      history?.turns.map((turn) => ({
        role: turn.role,
        message: turn.message,
        timestamp: turn.timestamp,
        taskId: turn.taskId,
      })) ?? [];

    const relatedMemories = this.options.memoryRecallRuntime.getRelevantMemories({
      userId: stored.userId,
      conversationId: stored.conversationId,
      intentDescription: historyTurns.at(-1)?.message ?? "",
    });

    const timelineEvents = stored.timelineId
      ? (this.options.timelineRuntime?.getEvents(stored.timelineId) ?? [])
      : [];

    return {
      sessionId: stored.sessionId,
      conversationId: stored.conversationId,
      userId: stored.userId,
      status: stored.status,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
      historyTurns,
      relatedMemories,
      timelineEvents,
      runtimeState:
        this.options.defaultRuntimeState ?? defaultRuntimeState(),
    };
  }
}

/**
 * Factory composing conversation history, memory recall, and timeline (Phase 76).
 */
export function createDefaultConversationWorkspaceRuntime(
  options: CreateDefaultConversationWorkspaceRuntimeOptions,
): ConversationWorkspaceRuntime {
  return new DefaultConversationWorkspaceRuntime(options);
}

export type { DefaultConversationWorkspaceRuntime };

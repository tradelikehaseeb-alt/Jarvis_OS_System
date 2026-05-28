import type { TaskExecutionRecord } from "../storage";

export interface SessionCheckpoint {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly pendingTaskId?: string;
  readonly messages: readonly SessionCheckpointMessage[];
  readonly savedAt: string;
}

export interface SessionCheckpointMessage {
  readonly role: string;
  readonly text: string;
}

export interface SessionRestoreResult {
  readonly restored: boolean;
  readonly sessionId?: string;
  readonly conversationId?: string;
  readonly pendingTaskId?: string;
  readonly messages: readonly SessionCheckpointMessage[];
  readonly message: string;
}

/**
 * Restores workspace sessions from checkpoints and pending tasks (Phase 94).
 */
export class SessionRestoreRuntime {
  constructor(
    private readonly loadCheckpoint: (
      sessionId: string,
    ) => SessionCheckpoint | undefined,
    private readonly findPendingTask?: (
      conversationId: string,
    ) => TaskExecutionRecord | undefined,
  ) {}

  restore(sessionId: string): SessionRestoreResult {
    const checkpoint = this.loadCheckpoint(sessionId);
    if (!checkpoint) {
      return {
        restored: false,
        messages: [],
        message: "No checkpoint found",
      };
    }

    const pending = this.findPendingTask?.(checkpoint.conversationId);
    const pendingTaskId =
      pending?.createTaskResponse.taskId ?? checkpoint.pendingTaskId;

    return {
      restored: true,
      sessionId: checkpoint.sessionId,
      conversationId: checkpoint.conversationId,
      pendingTaskId,
      messages: checkpoint.messages,
      message: pendingTaskId
        ? "Restored session with pending task"
        : "Restored session",
    };
  }
}

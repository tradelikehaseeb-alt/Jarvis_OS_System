import type { ChatMessage } from "../components/ChatMessages";

import {
  loadSessionCheckpoint,
  messagesToCheckpoint,
  saveSessionCheckpoint,
} from "./session-checkpoint-storage";

export interface SessionRestoreView {
  readonly restored: boolean;
  readonly messages: ChatMessage[];
  readonly pendingTaskId?: string;
  readonly message: string;
}

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `restored-${messageCounter}`;
}

/**
 * Restores desktop workspace session from checkpoint (Phase 94).
 */
export class SessionRestoreRuntime {
  persistCheckpoint(
    sessionId: string,
    conversationId: string,
    messages: readonly ChatMessage[],
    pendingTaskId?: string,
  ): void {
    saveSessionCheckpoint(
      messagesToCheckpoint(sessionId, conversationId, messages, pendingTaskId),
    );
  }

  restore(sessionId: string): SessionRestoreView {
    const checkpoint = loadSessionCheckpoint(sessionId);
    if (!checkpoint) {
      return {
        restored: false,
        messages: [],
        message: "No saved session",
      };
    }

    return {
      restored: true,
      pendingTaskId: checkpoint.pendingTaskId,
      message: checkpoint.pendingTaskId
        ? "Restored unfinished conversation"
        : "Restored conversation",
      messages: checkpoint.messages.map((entry) => ({
        id: nextMessageId(),
        role: entry.role === "assistant" ? "assistant" : "user",
        text: entry.text,
      })),
    };
  }
}

export const sessionRestoreRuntime = new SessionRestoreRuntime();

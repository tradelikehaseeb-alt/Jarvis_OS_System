import {
  LOCAL_MEMORY_SCHEMA_VERSION,
  type LocalMemoryRecord,
} from "@jarvis/local-memory";

import type { ConversationMemory } from "../memory/conversation-memory";
import type { ConversationHistory } from "./conversation-history";

export function recordToTurn(record: LocalMemoryRecord): ConversationMemory {
  const content = record.content as Partial<ConversationMemory>;
  return {
    conversationId: content.conversationId ?? record.conversationId ?? "",
    userId: content.userId ?? record.userId,
    turnIndex: content.turnIndex ?? 0,
    role: content.role ?? "user",
    message: content.message ?? "",
    taskId: content.taskId ?? record.taskId,
    intentKind: content.intentKind,
    timestamp: content.timestamp ?? record.timestamp,
  };
}

export function buildConversationHistory(
  turns: readonly ConversationMemory[],
): ConversationHistory | undefined {
  if (turns.length === 0) {
    return undefined;
  }

  const sorted = [...turns].sort((a, b) => a.turnIndex - b.turnIndex);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  return {
    conversationId: first.conversationId,
    userId: first.userId,
    turns: sorted,
    turnCount: sorted.length,
    startedAt: first.timestamp,
    updatedAt: last.timestamp,
  };
}

export function groupRecordsByConversation(
  records: readonly LocalMemoryRecord[],
): Map<string, ConversationMemory[]> {
  const grouped = new Map<string, ConversationMemory[]>();

  for (const record of records) {
    const turn = recordToTurn(record);
    const key = `${turn.userId}:${turn.conversationId}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(turn);
    grouped.set(key, bucket);
  }

  return grouped;
}

export function turnToLocalMemoryRecord(
  turn: ConversationMemory,
  recordId: string,
): LocalMemoryRecord {
  return {
    recordId,
    type: "conversation",
    userId: turn.userId,
    timestamp: turn.timestamp,
    taskId: turn.taskId,
    conversationId: turn.conversationId,
    content: { ...turn },
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
  };
}

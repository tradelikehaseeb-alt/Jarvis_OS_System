import type { LocalMemoryRuntime } from "@jarvis/local-memory";

import type {
  ConversationHistory,
  SaveConversationInput,
} from "./conversation-history";
import type { ConversationHistoryQuery } from "./conversation-history-query";
import type { ConversationHistoryResult } from "./conversation-history-result";
import type { ConversationHistoryRuntime } from "./conversation-history-runtime";
import {
  buildConversationHistory,
  groupRecordsByConversation,
  recordToTurn,
  turnToLocalMemoryRecord,
} from "./conversation-history-mappers";

let recordSequence = 0;

function nextRecordId(prefix: string): string {
  recordSequence += 1;
  return `${prefix}-${Date.now()}-${recordSequence}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Default conversation history runtime backed by {@link LocalMemoryRuntime} (Phase 63).
 */
export class DefaultConversationHistoryRuntime implements ConversationHistoryRuntime {
  constructor(private readonly localMemory: LocalMemoryRuntime) {}

  saveConversation(input: SaveConversationInput): ConversationHistory {
    const existing = this.localMemory.queryMemory({
      userId: input.userId,
      conversationId: input.conversationId,
      types: ["conversation"],
    });

    const turnIndex = existing.length + 1;
    const timestamp = nowIso();
    const turn = {
      conversationId: input.conversationId,
      userId: input.userId,
      turnIndex,
      role: input.role,
      message: input.message,
      taskId: input.taskId,
      intentKind: input.intentKind,
      timestamp,
    };

    this.localMemory.saveMemory(
      turnToLocalMemoryRecord(turn, nextRecordId("conv-turn")),
    );

    return buildConversationHistory([...existing.map(recordToTurn), turn])!;
  }

  getConversation(
    conversationId: string,
    userId: string,
  ): ConversationHistory | undefined {
    const records = this.localMemory.queryMemory({
      userId,
      conversationId,
      types: ["conversation"],
    });

    return buildConversationHistory(records.map(recordToTurn));
  }

  queryConversationHistory(
    query: ConversationHistoryQuery,
  ): ConversationHistoryResult {
    const records = this.localMemory.queryMemory({
      userId: query.userId,
      conversationId: query.conversationId,
      taskId: query.taskId,
      types: ["conversation"],
    });

    const grouped = groupRecordsByConversation(records);
    let histories = [...grouped.values()]
      .map((turns) => buildConversationHistory(turns))
      .filter((history): history is ConversationHistory => history !== undefined)
      .sort((a, b) => {
        const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
        if (byUpdated !== 0) {
          return byUpdated;
        }
        return b.turnCount - a.turnCount;
      });

    if (query.limit !== undefined) {
      histories = histories.slice(0, query.limit);
    }

    const totalTurns = histories.reduce(
      (count, history) => count + history.turnCount,
      0,
    );

    return {
      histories,
      totalTurns,
      queriedAt: nowIso(),
    };
  }

  getRecentHistory(
    userId: string,
    limit = 5,
  ): readonly ConversationHistory[] {
    return this.queryConversationHistory({ userId, limit }).histories;
  }
}

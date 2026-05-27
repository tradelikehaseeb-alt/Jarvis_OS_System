import type { ConversationHistoryRuntime } from "../conversation-history/conversation-history-runtime";
import type { ConversationMemory } from "../memory/conversation-memory";
import type { ContextQuery } from "./context-query";
import type { ContextRecord, ContextTurn } from "./context-record";

/**
 * Builds {@link ContextRecord} values from conversation history (Phase 64).
 */
export interface ContextBuilder {
  build(query: ContextQuery): ContextRecord;
  getRecent(query: ContextQuery): ContextRecord;
  getRelevant(query: ContextQuery): ContextRecord;
}

function toContextTurn(turn: ConversationMemory): ContextTurn {
  return {
    role: turn.role,
    message: turn.message,
    timestamp: turn.timestamp,
    taskId: turn.taskId,
    intentKind: turn.intentKind,
  };
}

function summarizeTurns(
  turns: readonly ContextTurn[],
  intentDescription?: string,
): string {
  if (turns.length === 0) {
    return intentDescription
      ? `No prior conversation context for: ${intentDescription}`
      : "No prior conversation context";
  }

  const preview = turns
    .slice(-3)
    .map((turn) => `${turn.role}: ${turn.message}`)
    .join(" | ");

  return `${turns.length} prior turn(s). Recent: ${preview}`;
}

function buildRecord(
  query: ContextQuery,
  turns: readonly ContextTurn[],
): ContextRecord {
  return {
    contextId: `ctx-${Date.now()}-${turns.length}`,
    userId: query.userId,
    conversationId: query.conversationId,
    taskId: query.taskId,
    intentDescription: query.intentDescription,
    turns,
    summary: summarizeTurns(turns, query.intentDescription),
    builtAt: new Date().toISOString(),
    source: turns.length > 0 ? "conversation-history" : "fallback",
  };
}

/**
 * Default context builder backed by {@link ConversationHistoryRuntime} (Phase 64).
 */
export class DefaultContextBuilder implements ContextBuilder {
  constructor(
    private readonly conversationHistory?: ConversationHistoryRuntime,
  ) {}

  build(query: ContextQuery): ContextRecord {
    return this.getRelevant(query);
  }

  getRecent(query: ContextQuery): ContextRecord {
    return buildRecord(query, this.collectRecentTurns(query));
  }

  getRelevant(query: ContextQuery): ContextRecord {
    return buildRecord(query, this.collectRelevantTurns(query));
  }

  private collectRecentTurns(query: ContextQuery): ContextTurn[] {
    if (!this.conversationHistory) {
      return [];
    }

    const limit = query.recentLimit ?? 10;

    if (query.conversationId) {
      const conversation = this.conversationHistory.getConversation(
        query.conversationId,
        query.userId,
      );
      return (conversation?.turns ?? []).slice(-limit).map(toContextTurn);
    }

    return this.conversationHistory
      .getRecentHistory(query.userId, 3)
      .flatMap((history) => history.turns)
      .slice(-limit)
      .map(toContextTurn);
  }

  private collectRelevantTurns(query: ContextQuery): ContextTurn[] {
    if (!this.conversationHistory) {
      return [];
    }

    const limit = query.relevantLimit ?? 10;
    let turns: ConversationMemory[] = [];

    if (query.conversationId) {
      const conversation = this.conversationHistory.getConversation(
        query.conversationId,
        query.userId,
      );
      turns = [...(conversation?.turns ?? [])];
    } else {
      turns = this.conversationHistory
        .getRecentHistory(query.userId, 3)
        .flatMap((history) => history.turns);
    }

    if (query.taskId) {
      const taskTurns = turns.filter((turn) => turn.taskId === query.taskId);
      if (taskTurns.length > 0) {
        turns = taskTurns;
      }
    }

    if (query.intentDescription) {
      const keywords = query.intentDescription
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);
      if (keywords.length > 0) {
        const matched = turns.filter((turn) =>
          keywords.some((keyword) =>
            turn.message.toLowerCase().includes(keyword),
          ),
        );
        if (matched.length > 0) {
          turns = matched;
        }
      }
    }

    return turns.slice(-limit).map(toContextTurn);
  }
}

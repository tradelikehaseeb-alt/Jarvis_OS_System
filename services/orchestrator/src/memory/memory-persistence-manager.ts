import type { ExecutionActivity } from "../execution/execution-activity";
import type { ExecutionEvent } from "../execution/execution-event";
import type { ExecutionLifecycleManager } from "../execution/execution-lifecycle-manager";
import type { ExecutionSession } from "../execution/execution-session";
import type { StreamManager } from "../streaming/stream-manager";
import type { ConversationMemory } from "./conversation-memory";
import type { ExecutionMemory } from "./execution-memory";
import { InMemoryMemoryStore } from "./in-memory-memory-store";
import type {
  GenerateSummaryInput,
  MemoryQuery,
  MemorySummary,
} from "./memory-query";
import type { MemoryRecord } from "./memory-record";
import type { MemoryStore } from "./memory-store";

export interface AttachLifecycleContext {
  readonly userId: string;
  readonly taskId: string;
  readonly sessionId: string;
  readonly conversationId: string;
}

export interface PersistConversationTurnInput {
  readonly conversationId: string;
  readonly userId: string;
  readonly role: ConversationMemory["role"];
  readonly message: string;
  readonly taskId?: string;
  readonly intentKind?: string;
}

let sequence = 0;

function nextRecordId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

function toRecord(
  type: MemoryRecord["type"],
  userId: string,
  content: Readonly<Record<string, unknown>>,
  refs: {
    taskId?: string;
    sessionId?: string;
    conversationId?: string;
  } = {},
): MemoryRecord {
  return {
    recordId: nextRecordId(`mem-${type}`),
    type,
    userId,
    timestamp: new Date().toISOString(),
    taskId: refs.taskId,
    sessionId: refs.sessionId,
    conversationId: refs.conversationId,
    content,
  };
}

/**
 * Orchestrator memory persistence — execution lifecycle + conversation history (Phase 46).
 */
export class MemoryPersistenceManager {
  private readonly turnCounts = new Map<string, number>();

  constructor(
    private readonly store: MemoryStore = new InMemoryMemoryStore(),
    private readonly streamManager?: StreamManager,
  ) {}

  saveRecord(record: MemoryRecord): MemoryRecord {
    const saved = this.store.saveRecord(record);
    this.publishMemorySaved(saved);
    return saved;
  }

  getRecord(recordId: string): MemoryRecord | undefined {
    return this.store.getRecord(recordId);
  }

  queryHistory(query: MemoryQuery): readonly MemoryRecord[] {
    return this.store.queryHistory(query);
  }

  getRecentActivity(userId: string, limit = 10): readonly MemoryRecord[] {
    return this.store.queryHistory({
      userId,
      types: ["activity"],
      limit,
    });
  }

  generateSummary(input: GenerateSummaryInput): MemorySummary {
    const history = this.store.queryHistory({
      userId: input.userId,
      conversationId: input.conversationId,
    });

    const executionRecords = history.filter((r) => r.type === "execution");
    const conversationRecords = history.filter((r) => r.type === "conversation");
    const taskIds = new Set(
      history.map((r) => r.taskId).filter((id): id is string => Boolean(id)),
    );

    const lastConversation = conversationRecords.at(-1);
    const lastExecution = executionRecords.at(-1);
    const lastState =
      lastExecution && typeof lastExecution.content.state === "string"
        ? lastExecution.content.state
        : "unknown";

    const text = [
      `Memory summary for user ${input.userId}.`,
      `Records: ${history.length}; tasks: ${taskIds.size}.`,
      lastConversation
        ? `Last message (${lastConversation.content.role}): ${String(lastConversation.content.message)}`
        : "No conversation turns stored.",
      lastExecution
        ? `Last execution state: ${lastState}.`
        : "No execution snapshots stored.",
      input.taskId ? `Current task: ${input.taskId}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const summaryRecord = this.saveRecord(
      toRecord(
        "summary",
        input.userId,
        { text, recordCount: history.length, taskCount: taskIds.size },
        {
          taskId: input.taskId,
          conversationId: input.conversationId,
        },
      ),
    );

    return {
      text: String(summaryRecord.content.text),
      recordCount: history.length,
      taskCount: taskIds.size,
    };
  }

  persistConversationTurn(input: PersistConversationTurnInput): MemoryRecord {
    const turnKey = `${input.conversationId}:${input.userId}`;
    const turnIndex = (this.turnCounts.get(turnKey) ?? 0) + 1;
    this.turnCounts.set(turnKey, turnIndex);

    const turn: ConversationMemory = {
      conversationId: input.conversationId,
      userId: input.userId,
      turnIndex,
      role: input.role,
      message: input.message,
      taskId: input.taskId,
      intentKind: input.intentKind,
      timestamp: new Date().toISOString(),
    };

    const record = this.saveRecord(
      toRecord("conversation", input.userId, { ...turn }, {
        taskId: input.taskId,
        conversationId: input.conversationId,
      }),
    );

    this.publishConversationUpdated(record, turn);
    return record;
  }

  persistExecutionSession(
    session: ExecutionSession,
    conversationId?: string,
  ): MemoryRecord {
    const snapshot: ExecutionMemory = {
      sessionId: session.sessionId,
      taskId: session.taskId,
      userId: session.userId,
      state: session.state,
      events: session.events,
      activities: session.activities,
      timestamp: new Date().toISOString(),
    };

    return this.saveRecord(
      toRecord("execution", session.userId, { ...snapshot }, {
        taskId: session.taskId,
        sessionId: session.sessionId,
        conversationId,
      }),
    );
  }

  persistActivity(
    activity: ExecutionActivity,
    context: AttachLifecycleContext,
  ): MemoryRecord {
    return this.saveRecord(
      toRecord("activity", context.userId, { ...activity }, {
        taskId: context.taskId,
        sessionId: context.sessionId,
        conversationId: context.conversationId,
      }),
    );
  }

  persistLifecycleEvent(
    event: ExecutionEvent,
    context: AttachLifecycleContext,
  ): MemoryRecord {
    return this.saveRecord(
      toRecord("activity", context.userId, { eventKind: event.kind, ...event }, {
        taskId: context.taskId,
        sessionId: context.sessionId,
        conversationId: context.conversationId,
      }),
    );
  }

  attachLifecycle(
    lifecycle: ExecutionLifecycleManager,
    context: AttachLifecycleContext,
  ): () => void {
    const unsubscribeEvents = lifecycle.subscribe((event) => {
      this.persistLifecycleEvent(event, context);
    });
    const unsubscribeActivities = lifecycle.subscribeActivities((activity) => {
      this.persistActivity(activity, context);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeActivities();
    };
  }

  private publishMemorySaved(record: MemoryRecord): void {
    if (!this.streamManager || !record.taskId) {
      return;
    }

    const sessionId = record.sessionId ?? `exec-session-${record.taskId}`;

    this.streamManager.publish({
      type: "memory_saved",
      streamSessionId: `stream-${record.taskId}`,
      sessionId,
      taskId: record.taskId,
      userId: record.userId,
      conversationId: record.conversationId,
      message: `Memory record saved (${record.type})`,
      payload: {
        recordId: record.recordId,
        memoryType: record.type,
      },
    });
  }

  private publishConversationUpdated(
    record: MemoryRecord,
    turn: ConversationMemory,
  ): void {
    if (!this.streamManager || !record.taskId) {
      return;
    }

    const sessionId = record.sessionId ?? `exec-session-${record.taskId}`;

    this.streamManager.publish({
      type: "conversation_updated",
      streamSessionId: `stream-${record.taskId}`,
      sessionId,
      taskId: record.taskId,
      userId: record.userId,
      conversationId: record.conversationId,
      message: `Conversation turn ${turn.turnIndex} (${turn.role})`,
      payload: {
        recordId: record.recordId,
        role: turn.role,
        turnIndex: turn.turnIndex,
        message: turn.message,
      },
    });
  }
}

/**
 * Shared history query filter (Phase 67).
 */
export interface HistoryQueryFilter {
  readonly userId: string;
  readonly types?: readonly string[];
  readonly taskId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
}

/**
 * Record fields used for history query matching (Phase 67).
 */
export interface HistoryRecordFields {
  readonly userId: string;
  readonly type?: string;
  readonly taskId?: string;
  readonly sessionId?: string;
  readonly conversationId?: string;
}

/**
 * Matches a history record against query filters (Phase 67).
 */
export function matchesHistoryQuery(
  record: HistoryRecordFields,
  query: HistoryQueryFilter,
): boolean {
  if (record.userId !== query.userId) {
    return false;
  }
  if (query.types && record.type && !query.types.includes(record.type)) {
    return false;
  }
  if (query.taskId && record.taskId !== query.taskId) {
    return false;
  }
  if (query.sessionId && record.sessionId !== query.sessionId) {
    return false;
  }
  if (query.conversationId && record.conversationId !== query.conversationId) {
    return false;
  }
  return true;
}

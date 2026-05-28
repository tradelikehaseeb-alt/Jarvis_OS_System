import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";

const PRODUCTIVITY_SESSION_KEY = "productivitySession" as const;

export interface StoredProductivitySession {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly focus?: string;
  readonly taskCount: number;
  readonly state: string;
  readonly updatedAt: string;
}

function recordId(userId: string, sessionId: string): string {
  return `productivity-session-${userId}-${sessionId}`;
}

function toRecord(session: StoredProductivitySession): LocalMemoryRecord {
  return {
    recordId: recordId(session.userId, session.sessionId),
    type: "productivity-session",
    userId: session.userId,
    conversationId: session.conversationId,
    sessionId: session.sessionId,
    timestamp: session.updatedAt,
    content: { [PRODUCTIVITY_SESSION_KEY]: session },
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
  };
}

function fromRecord(record: LocalMemoryRecord): StoredProductivitySession | undefined {
  const payload = record.content[PRODUCTIVITY_SESSION_KEY];
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  return payload as StoredProductivitySession;
}

export function saveProductivitySession(
  runtime: LocalMemoryRuntime,
  session: StoredProductivitySession,
): StoredProductivitySession {
  runtime.saveMemory(toRecord(session));
  return session;
}

export function loadProductivitySession(
  runtime: LocalMemoryRuntime,
  userId: string,
  sessionId: string,
): StoredProductivitySession | undefined {
  const record = runtime.getMemory(recordId(userId, sessionId));
  if (!record) {
    return undefined;
  }
  return fromRecord(record);
}

export function listProductivitySessions(
  runtime: LocalMemoryRuntime,
  userId: string,
): readonly StoredProductivitySession[] {
  return runtime
    .queryMemory({ userId, types: ["productivity-session"] })
    .map(fromRecord)
    .filter((entry): entry is StoredProductivitySession => entry !== undefined);
}

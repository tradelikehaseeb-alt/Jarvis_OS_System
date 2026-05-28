import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";

const WORKFORCE_SESSION_KEY = "workforceSession" as const;

export interface StoredWorkforceSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly workerTypes: readonly string[];
  readonly state: string;
  readonly sharedContextRef?: string;
  readonly updatedAt: string;
}

function recordId(userId: string, sessionId: string): string {
  return `workforce-session-${userId}-${sessionId}`;
}

function toRecord(session: StoredWorkforceSession): LocalMemoryRecord {
  return {
    recordId: recordId(session.userId, session.sessionId),
    type: "workforce-session",
    userId: session.userId,
    conversationId: session.conversationId,
    sessionId: session.sessionId,
    timestamp: session.updatedAt,
    content: { [WORKFORCE_SESSION_KEY]: session },
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
  };
}

function fromRecord(record: LocalMemoryRecord): StoredWorkforceSession | undefined {
  const payload = record.content[WORKFORCE_SESSION_KEY];
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  return payload as StoredWorkforceSession;
}

export function saveWorkforceSession(
  runtime: LocalMemoryRuntime,
  session: StoredWorkforceSession,
): StoredWorkforceSession {
  runtime.saveMemory(toRecord(session));
  return session;
}

export function loadWorkforceSession(
  runtime: LocalMemoryRuntime,
  userId: string,
  sessionId: string,
): StoredWorkforceSession | undefined {
  const record = runtime.getMemory(recordId(userId, sessionId));
  if (!record) {
    return undefined;
  }
  return fromRecord(record);
}

export function listWorkforceSessions(
  runtime: LocalMemoryRuntime,
  userId: string,
): readonly StoredWorkforceSession[] {
  return runtime
    .queryMemory({ userId, types: ["workforce-session"] })
    .map(fromRecord)
    .filter((entry): entry is StoredWorkforceSession => entry !== undefined);
}

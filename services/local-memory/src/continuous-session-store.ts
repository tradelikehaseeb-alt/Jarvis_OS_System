import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";

const CONTINUOUS_SESSION_KEY = "continuousSession" as const;

export interface StoredContinuousSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly conversationId?: string;
  readonly presence: string;
  readonly backgroundTaskCount: number;
  readonly state: string;
  readonly updatedAt: string;
}

function recordId(userId: string, sessionId: string): string {
  return `continuous-session-${userId}-${sessionId}`;
}

function toRecord(session: StoredContinuousSession): LocalMemoryRecord {
  return {
    recordId: recordId(session.userId, session.sessionId),
    type: "continuous-session",
    userId: session.userId,
    conversationId: session.conversationId,
    sessionId: session.sessionId,
    timestamp: session.updatedAt,
    content: { [CONTINUOUS_SESSION_KEY]: session },
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
  };
}

function fromRecord(record: LocalMemoryRecord): StoredContinuousSession | undefined {
  const payload = record.content[CONTINUOUS_SESSION_KEY];
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  return payload as StoredContinuousSession;
}

export function saveContinuousSession(
  runtime: LocalMemoryRuntime,
  session: StoredContinuousSession,
): StoredContinuousSession {
  runtime.saveMemory(toRecord(session));
  return session;
}

export function loadContinuousSession(
  runtime: LocalMemoryRuntime,
  userId: string,
  sessionId: string,
): StoredContinuousSession | undefined {
  const record = runtime.getMemory(recordId(userId, sessionId));
  if (!record) {
    return undefined;
  }
  return fromRecord(record);
}

export function listContinuousSessions(
  runtime: LocalMemoryRuntime,
  userId: string,
): readonly StoredContinuousSession[] {
  return runtime
    .queryMemory({ userId, types: ["continuous-session"] })
    .map(fromRecord)
    .filter((entry): entry is StoredContinuousSession => entry !== undefined);
}

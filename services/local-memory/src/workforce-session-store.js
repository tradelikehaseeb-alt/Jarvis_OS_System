import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";
const WORKFORCE_SESSION_KEY = "workforceSession";
function recordId(userId, sessionId) {
    return `workforce-session-${userId}-${sessionId}`;
}
function toRecord(session) {
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
function fromRecord(record) {
    const payload = record.content[WORKFORCE_SESSION_KEY];
    if (!payload || typeof payload !== "object") {
        return undefined;
    }
    return payload;
}
export function saveWorkforceSession(runtime, session) {
    runtime.saveMemory(toRecord(session));
    return session;
}
export function loadWorkforceSession(runtime, userId, sessionId) {
    const record = runtime.getMemory(recordId(userId, sessionId));
    if (!record) {
        return undefined;
    }
    return fromRecord(record);
}
export function listWorkforceSessions(runtime, userId) {
    return runtime
        .queryMemory({ userId, types: ["workforce-session"] })
        .map(fromRecord)
        .filter((entry) => entry !== undefined);
}

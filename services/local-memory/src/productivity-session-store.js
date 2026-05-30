import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";
const PRODUCTIVITY_SESSION_KEY = "productivitySession";
function recordId(userId, sessionId) {
    return `productivity-session-${userId}-${sessionId}`;
}
function toRecord(session) {
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
function fromRecord(record) {
    const payload = record.content[PRODUCTIVITY_SESSION_KEY];
    if (!payload || typeof payload !== "object") {
        return undefined;
    }
    return payload;
}
export function saveProductivitySession(runtime, session) {
    runtime.saveMemory(toRecord(session));
    return session;
}
export function loadProductivitySession(runtime, userId, sessionId) {
    const record = runtime.getMemory(recordId(userId, sessionId));
    if (!record) {
        return undefined;
    }
    return fromRecord(record);
}
export function listProductivitySessions(runtime, userId) {
    return runtime
        .queryMemory({ userId, types: ["productivity-session"] })
        .map(fromRecord)
        .filter((entry) => entry !== undefined);
}

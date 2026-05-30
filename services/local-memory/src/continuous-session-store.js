import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";
const CONTINUOUS_SESSION_KEY = "continuousSession";
function recordId(userId, sessionId) {
    return `continuous-session-${userId}-${sessionId}`;
}
function toRecord(session) {
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
function fromRecord(record) {
    const payload = record.content[CONTINUOUS_SESSION_KEY];
    if (!payload || typeof payload !== "object") {
        return undefined;
    }
    return payload;
}
export function saveContinuousSession(runtime, session) {
    runtime.saveMemory(toRecord(session));
    return session;
}
export function loadContinuousSession(runtime, userId, sessionId) {
    const record = runtime.getMemory(recordId(userId, sessionId));
    if (!record) {
        return undefined;
    }
    return fromRecord(record);
}
export function listContinuousSessions(runtime, userId) {
    return runtime
        .queryMemory({ userId, types: ["continuous-session"] })
        .map(fromRecord)
        .filter((entry) => entry !== undefined);
}

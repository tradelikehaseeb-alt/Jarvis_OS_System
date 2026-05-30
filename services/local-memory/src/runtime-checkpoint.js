import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";
const CHECKPOINT_CONTENT_KEY = "runtimeCheckpoint";
export function saveRuntimeCheckpoint(runtime, checkpoint) {
    runtime.saveMemory({
        recordId: `runtime-checkpoint-${checkpoint.sessionId}`,
        type: "summary",
        userId: checkpoint.userId,
        timestamp: checkpoint.savedAt,
        sessionId: checkpoint.sessionId,
        conversationId: checkpoint.conversationId,
        content: { [CHECKPOINT_CONTENT_KEY]: checkpoint },
        schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
    });
    return checkpoint;
}
export function loadRuntimeCheckpoint(runtime, sessionId) {
    const record = runtime.getMemory(`runtime-checkpoint-${sessionId}`);
    if (!record) {
        return undefined;
    }
    const payload = record.content[CHECKPOINT_CONTENT_KEY];
    if (!payload || typeof payload !== "object") {
        return undefined;
    }
    return payload;
}

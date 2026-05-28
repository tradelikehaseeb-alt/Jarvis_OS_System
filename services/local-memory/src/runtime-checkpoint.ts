import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";

export interface RuntimeCheckpointRecord {
  readonly checkpointId: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly conversationId?: string;
  readonly pendingTaskId?: string;
  readonly savedAt: string;
}

const CHECKPOINT_CONTENT_KEY = "runtimeCheckpoint";

export function saveRuntimeCheckpoint(
  runtime: LocalMemoryRuntime,
  checkpoint: RuntimeCheckpointRecord,
): RuntimeCheckpointRecord {
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

export function loadRuntimeCheckpoint(
  runtime: LocalMemoryRuntime,
  sessionId: string,
): RuntimeCheckpointRecord | undefined {
  const record = runtime.getMemory(`runtime-checkpoint-${sessionId}`);
  if (!record) {
    return undefined;
  }
  const payload = record.content[CHECKPOINT_CONTENT_KEY];
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  return payload as RuntimeCheckpointRecord;
}

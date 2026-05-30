import type { LocalMemoryRuntime } from "./local-memory-runtime";
export interface RuntimeCheckpointRecord {
    readonly checkpointId: string;
    readonly userId: string;
    readonly sessionId: string;
    readonly conversationId?: string;
    readonly pendingTaskId?: string;
    readonly savedAt: string;
}
export declare function saveRuntimeCheckpoint(runtime: LocalMemoryRuntime, checkpoint: RuntimeCheckpointRecord): RuntimeCheckpointRecord;
export declare function loadRuntimeCheckpoint(runtime: LocalMemoryRuntime, sessionId: string): RuntimeCheckpointRecord | undefined;
//# sourceMappingURL=runtime-checkpoint.d.ts.map
import type { LocalMemoryRepository } from "./local-memory-repository";
import type { LocalMemoryRuntime } from "./local-memory-runtime";
export interface DefaultLocalMemoryRuntimeOptions {
    readonly filePath?: string;
    readonly useFileBackend?: boolean;
    readonly repository?: LocalMemoryRepository;
}
/**
 * Default local memory runtime implementation (Phase 62).
 */
export declare class DefaultLocalMemoryRuntime implements LocalMemoryRuntime {
    private readonly repository;
    constructor(repository: LocalMemoryRepository);
    saveMemory(record: Parameters<LocalMemoryRuntime["saveMemory"]>[0]): import("./local-memory-record").LocalMemoryRecord;
    getMemory(recordId: string): import("./local-memory-record").LocalMemoryRecord | undefined;
    queryMemory(query: Parameters<LocalMemoryRuntime["queryMemory"]>[0]): readonly import("./local-memory-record").LocalMemoryRecord[];
    deleteMemory(recordId: string): boolean;
    getHealth(): import("./local-memory-health").LocalMemoryHealth;
    createSession(userId: string): import("./local-memory-session").LocalMemorySession;
}
/**
 * Factory for default local memory runtime with file persistence (Phase 62).
 * Falls back to in-memory repository when file backend is disabled.
 */
export declare function createDefaultLocalMemoryRuntime(options?: DefaultLocalMemoryRuntimeOptions): LocalMemoryRuntime;
//# sourceMappingURL=create-default-local-memory-runtime.d.ts.map
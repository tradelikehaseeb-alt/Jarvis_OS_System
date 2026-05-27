import type { LocalMemoryHealth } from "./local-memory-health";
import type { LocalMemoryQuery } from "./local-memory-query";
import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemorySession } from "./local-memory-session";
import type { LocalMemoryRepository } from "./local-memory-repository";
/** Default local memory JSON store (Phase 62). */
export declare const DEFAULT_LOCAL_MEMORY_FILE: string;
export declare const LOCAL_MEMORY_SCHEMA_VERSION = 1;
/**
 * In-memory local memory repository — fallback backend (Phase 62).
 */
export declare class InMemoryLocalMemoryRepository implements LocalMemoryRepository {
    private readonly records;
    private readonly sessions;
    save(record: LocalMemoryRecord): LocalMemoryRecord;
    get(recordId: string): LocalMemoryRecord | undefined;
    query(query: LocalMemoryQuery): readonly LocalMemoryRecord[];
    delete(recordId: string): boolean;
    getHealth(): LocalMemoryHealth;
    createSession(userId: string): LocalMemorySession;
}
/**
 * File-backed local memory repository — JSON store with SQLite-ready schema (Phase 62).
 */
export declare class FileLocalMemoryRepository implements LocalMemoryRepository {
    private readonly filePath;
    private store;
    constructor(filePath?: string);
    save(record: LocalMemoryRecord): LocalMemoryRecord;
    get(recordId: string): LocalMemoryRecord | undefined;
    query(query: LocalMemoryQuery): readonly LocalMemoryRecord[];
    delete(recordId: string): boolean;
    getHealth(): LocalMemoryHealth;
    createSession(userId: string): LocalMemorySession;
    getFilePath(): string;
    private loadFromDisk;
    private flushToDisk;
}
//# sourceMappingURL=file-local-memory-repository.d.ts.map
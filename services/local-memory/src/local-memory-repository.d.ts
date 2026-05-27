import type { LocalMemoryHealth } from "./local-memory-health";
import type { LocalMemoryQuery } from "./local-memory-query";
import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemorySession } from "./local-memory-session";
/**
 * Local memory repository contract (Phase 62).
 */
export interface LocalMemoryRepository {
    save(record: LocalMemoryRecord): LocalMemoryRecord;
    get(recordId: string): LocalMemoryRecord | undefined;
    query(query: LocalMemoryQuery): readonly LocalMemoryRecord[];
    delete(recordId: string): boolean;
    getHealth(): LocalMemoryHealth;
    createSession(userId: string): LocalMemorySession;
}
//# sourceMappingURL=local-memory-repository.d.ts.map
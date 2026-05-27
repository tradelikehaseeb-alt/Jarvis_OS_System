import type { LocalMemoryHealth } from "./local-memory-health";
import type { LocalMemoryQuery } from "./local-memory-query";
import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemorySession } from "./local-memory-session";

/**
 * Local memory runtime contract (Phase 62).
 */
export interface LocalMemoryRuntime {
  saveMemory(record: LocalMemoryRecord): LocalMemoryRecord;
  getMemory(recordId: string): LocalMemoryRecord | undefined;
  queryMemory(query: LocalMemoryQuery): readonly LocalMemoryRecord[];
  deleteMemory(recordId: string): boolean;
  getHealth(): LocalMemoryHealth;
  createSession(userId: string): LocalMemorySession;
}

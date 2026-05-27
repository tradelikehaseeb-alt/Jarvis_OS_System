import type { ContextQuery } from "./context-query";
import type { ContextRecord } from "./context-record";

/**
 * Agent execution context runtime contract (Phase 64).
 */
export interface ContextRuntime {
  buildContext(query: ContextQuery): ContextRecord;
  getRecentContext(query: ContextQuery): ContextRecord;
  getRelevantContext(query: ContextQuery): ContextRecord;
}

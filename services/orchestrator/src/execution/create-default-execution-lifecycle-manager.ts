import type { ExecutionLifecycleManager } from "./execution-lifecycle-manager";
import { InMemoryExecutionLifecycleManager } from "./in-memory-execution-lifecycle-manager";

/**
 * Factory for default in-memory execution lifecycle manager (Phase 45).
 */
export function createDefaultExecutionLifecycleManager(): ExecutionLifecycleManager {
  return new InMemoryExecutionLifecycleManager();
}

import { InMemoryStreamManager } from "./in-memory-stream-manager";
import type { StreamManager } from "./stream-manager";

/**
 * Factory for default in-memory stream manager (Phase 47).
 */
export function createDefaultStreamManager(): StreamManager {
  return new InMemoryStreamManager();
}

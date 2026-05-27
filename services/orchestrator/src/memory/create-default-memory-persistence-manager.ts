import { MemoryPersistenceManager } from "./memory-persistence-manager";
import type { MemoryStore } from "./memory-store";
import { InMemoryMemoryStore } from "./in-memory-memory-store";
import type { StreamManager } from "../streaming/stream-manager";

/**
 * Factory for default in-memory memory persistence manager (Phase 46).
 */
export function createDefaultMemoryPersistenceManager(
  store: MemoryStore = new InMemoryMemoryStore(),
  streamManager?: StreamManager,
): MemoryPersistenceManager {
  return new MemoryPersistenceManager(store, streamManager);
}

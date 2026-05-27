import { MemoryPersistenceManager } from "./memory-persistence-manager";
import type { MemoryStore } from "./memory-store";
import { StorageBackedMemoryStore } from "./storage-backed-memory-store";
import type { StreamManager } from "../streaming/stream-manager";
import {
  createDefaultStorageRuntime,
  createFileStorageRuntime,
} from "../storage-runtime/create-default-storage-runtime";

/**
 * Factory for default in-memory memory persistence manager (Phase 46).
 * Uses {@link StorageBackedMemoryStore} with in-memory storage runtime (Phase 51).
 */
export function createDefaultMemoryPersistenceManager(
  store?: MemoryStore,
  streamManager?: StreamManager,
): MemoryPersistenceManager {
  const memoryStore =
    store ?? new StorageBackedMemoryStore(createDefaultStorageRuntime());
  return new MemoryPersistenceManager(memoryStore, streamManager);
}

/**
 * Memory persistence manager with file-backed storage runtime (Phase 51).
 */
export function createFileBackedMemoryPersistenceManager(
  filePath: string,
  streamManager?: StreamManager,
): MemoryPersistenceManager {
  return new MemoryPersistenceManager(
    new StorageBackedMemoryStore(createFileStorageRuntime(filePath)),
    streamManager,
  );
}

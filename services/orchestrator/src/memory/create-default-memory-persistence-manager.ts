import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";

import { MemoryPersistenceManager } from "./memory-persistence-manager";
import type { MemoryStore } from "./memory-store";
import { LocalMemoryBackedMemoryStore } from "./local-memory-backed-memory-store";
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

/**
 * Memory persistence manager with local file-backed memory runtime (Phase 62).
 * Uses SQLite-ready JSON store; in-memory fallback when file backend is disabled.
 */
export function createLocalBackedMemoryPersistenceManager(
  filePath?: string,
  streamManager?: StreamManager,
  options?: { readonly useFileBackend?: boolean; readonly runtime?: LocalMemoryRuntime },
): MemoryPersistenceManager {
  const runtime =
    options?.runtime ??
    createDefaultLocalMemoryRuntime({
      filePath,
      useFileBackend: options?.useFileBackend ?? true,
    });

  return new MemoryPersistenceManager(
    new LocalMemoryBackedMemoryStore(runtime),
    streamManager,
  );
}

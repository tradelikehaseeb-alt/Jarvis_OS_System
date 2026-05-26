import { FileTaskStore, DEFAULT_BRIDGE_TASK_STORE_FILE } from "./file-task-store";
import { InMemoryTaskStore } from "./in-memory-task-store";
import type { TaskStore } from "./task-store";

/** Supported task store backends (Phase 15). */
export type TaskStoreKind = "memory" | "file";

/**
 * Options for {@link TaskStoreFactory.create}.
 */
export interface CreateTaskStoreOptions {
  readonly kind: TaskStoreKind;
  /** Override path when `kind` is `file`. */
  readonly filePath?: string;
}

/**
 * Creates {@link TaskStore} implementations — orchestrator does not construct stores directly.
 */
export class TaskStoreFactory {
  /**
   * Build a store for the requested kind.
   */
  static create(options: CreateTaskStoreOptions): TaskStore {
    if (options.kind === "file") {
      return new FileTaskStore(options.filePath ?? DEFAULT_BRIDGE_TASK_STORE_FILE);
    }
    return new InMemoryTaskStore();
  }

  /** In-memory store for unit tests. */
  static createInMemory(): InMemoryTaskStore {
    return new InMemoryTaskStore();
  }

  /** File-backed store with optional custom path. */
  static createFile(filePath?: string): FileTaskStore {
    return new FileTaskStore(filePath ?? DEFAULT_BRIDGE_TASK_STORE_FILE);
  }

  /**
   * Shared default store for local CLI bridge (file-backed singleton).
   */
  static getSharedDefault(): TaskStore {
    return getSharedTaskStore();
  }
}

let sharedDefaultStore: FileTaskStore | undefined;

/**
 * Process-wide singleton file store for `orchestrator-bridge` subprocesses.
 */
export function getSharedTaskStore(): TaskStore {
  if (!sharedDefaultStore) {
    sharedDefaultStore = new FileTaskStore();
  }
  return sharedDefaultStore;
}

/** Reset shared singleton (tests only). */
export function resetSharedTaskStore(): void {
  sharedDefaultStore = undefined;
}

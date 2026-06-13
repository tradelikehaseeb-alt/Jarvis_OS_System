import {
  FileLocalMemoryRepository,
  InMemoryLocalMemoryRepository,
} from "./file-local-memory-repository";
import type { LocalMemoryRepository } from "./local-memory-repository";
import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { resolveLocalMemoryStorage } from "./resolve-local-memory-storage";

export interface DefaultLocalMemoryRuntimeOptions {
  readonly filePath?: string;
  readonly useFileBackend?: boolean;
  readonly repository?: LocalMemoryRepository;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

/**
 * Default local memory runtime implementation (Phase 62).
 */
export class DefaultLocalMemoryRuntime implements LocalMemoryRuntime {
  constructor(private readonly repository: LocalMemoryRepository) {}

  saveMemory(record: Parameters<LocalMemoryRuntime["saveMemory"]>[0]) {
    return this.repository.save(record);
  }

  getMemory(recordId: string) {
    return this.repository.get(recordId);
  }

  queryMemory(query: Parameters<LocalMemoryRuntime["queryMemory"]>[0]) {
    return this.repository.query(query);
  }

  deleteMemory(recordId: string) {
    return this.repository.delete(recordId);
  }

  getHealth() {
    return this.repository.getHealth();
  }

  createSession(userId: string) {
    return this.repository.createSession(userId);
  }
}

/**
 * Factory for default local memory runtime with file persistence (Phase 62).
 * Falls back to in-memory repository when file backend is disabled.
 */
export function createDefaultLocalMemoryRuntime(
  options?: DefaultLocalMemoryRuntimeOptions,
): LocalMemoryRuntime {
  if (options?.repository) {
    return new DefaultLocalMemoryRuntime(options.repository);
  }

  const resolved = resolveLocalMemoryStorage({
    filePath: options?.filePath,
    useFileBackend: options?.useFileBackend,
    env: options?.env,
  });
  const repository = resolved.useFileBackend
    ? new FileLocalMemoryRepository(resolved.filePath)
    : new InMemoryLocalMemoryRepository();

  return new DefaultLocalMemoryRuntime(repository);
}

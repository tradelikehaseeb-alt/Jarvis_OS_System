import { FileLocalMemoryRepository, InMemoryLocalMemoryRepository, } from "./file-local-memory-repository";
/**
 * Default local memory runtime implementation (Phase 62).
 */
export class DefaultLocalMemoryRuntime {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    saveMemory(record) {
        return this.repository.save(record);
    }
    getMemory(recordId) {
        return this.repository.get(recordId);
    }
    queryMemory(query) {
        return this.repository.query(query);
    }
    deleteMemory(recordId) {
        return this.repository.delete(recordId);
    }
    getHealth() {
        return this.repository.getHealth();
    }
    createSession(userId) {
        return this.repository.createSession(userId);
    }
}
/**
 * Factory for default local memory runtime with file persistence (Phase 62).
 * Falls back to in-memory repository when file backend is disabled.
 */
export function createDefaultLocalMemoryRuntime(options) {
    if (options?.repository) {
        return new DefaultLocalMemoryRuntime(options.repository);
    }
    const useFile = options?.useFileBackend ?? true;
    const repository = useFile
        ? new FileLocalMemoryRepository(options?.filePath)
        : new InMemoryLocalMemoryRepository();
    return new DefaultLocalMemoryRuntime(repository);
}

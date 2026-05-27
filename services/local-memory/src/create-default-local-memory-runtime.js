"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultLocalMemoryRuntime = void 0;
exports.createDefaultLocalMemoryRuntime = createDefaultLocalMemoryRuntime;
const file_local_memory_repository_1 = require("./file-local-memory-repository");
/**
 * Default local memory runtime implementation (Phase 62).
 */
class DefaultLocalMemoryRuntime {
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
exports.DefaultLocalMemoryRuntime = DefaultLocalMemoryRuntime;
/**
 * Factory for default local memory runtime with file persistence (Phase 62).
 * Falls back to in-memory repository when file backend is disabled.
 */
function createDefaultLocalMemoryRuntime(options) {
    if (options?.repository) {
        return new DefaultLocalMemoryRuntime(options.repository);
    }
    const useFile = options?.useFileBackend ?? true;
    const repository = useFile
        ? new file_local_memory_repository_1.FileLocalMemoryRepository(options?.filePath)
        : new file_local_memory_repository_1.InMemoryLocalMemoryRepository();
    return new DefaultLocalMemoryRuntime(repository);
}

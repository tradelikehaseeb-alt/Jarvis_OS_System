"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLocalMemoryRepository = exports.InMemoryLocalMemoryRepository = exports.LOCAL_MEMORY_SCHEMA_VERSION = exports.DEFAULT_LOCAL_MEMORY_FILE = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
/** Default local memory JSON store (Phase 62). */
exports.DEFAULT_LOCAL_MEMORY_FILE = (0, node_path_1.join)(__dirname, "..", "..", "..", "api-gateway", ".jarvis-task-store", "local-memory.json");
exports.LOCAL_MEMORY_SCHEMA_VERSION = 1;
function nowIso() {
    return new Date().toISOString();
}
function emptyStore() {
    return {
        schemaVersion: exports.LOCAL_MEMORY_SCHEMA_VERSION,
        backend: "file",
        sqliteReady: true,
        records: {},
        sessions: {},
    };
}
function matchesQuery(record, query) {
    if (record.userId !== query.userId) {
        return false;
    }
    if (query.types && !query.types.includes(record.type)) {
        return false;
    }
    if (query.taskId && record.taskId !== query.taskId) {
        return false;
    }
    if (query.sessionId && record.sessionId !== query.sessionId) {
        return false;
    }
    if (query.conversationId && record.conversationId !== query.conversationId) {
        return false;
    }
    return true;
}
let sessionCounter = 0;
function nextSessionId() {
    sessionCounter += 1;
    return `local-memory-session-${sessionCounter}`;
}
/**
 * In-memory local memory repository — fallback backend (Phase 62).
 */
class InMemoryLocalMemoryRepository {
    records = new Map();
    sessions = new Map();
    save(record) {
        this.records.set(record.recordId, record);
        return record;
    }
    get(recordId) {
        return this.records.get(recordId);
    }
    query(query) {
        const results = [...this.records.values()]
            .filter((record) => matchesQuery(record, query))
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return query.limit ? results.slice(-query.limit) : results;
    }
    delete(recordId) {
        return this.records.delete(recordId);
    }
    getHealth() {
        return {
            status: "healthy",
            backend: "memory",
            recordCount: this.records.size,
            message: "In-memory local memory fallback",
            checkedAt: nowIso(),
        };
    }
    createSession(userId) {
        const session = {
            sessionId: nextSessionId(),
            userId,
            startedAt: nowIso(),
        };
        this.sessions.set(session.sessionId, session);
        return session;
    }
}
exports.InMemoryLocalMemoryRepository = InMemoryLocalMemoryRepository;
/**
 * File-backed local memory repository — JSON store with SQLite-ready schema (Phase 62).
 */
class FileLocalMemoryRepository {
    filePath;
    store = emptyStore();
    constructor(filePath = exports.DEFAULT_LOCAL_MEMORY_FILE) {
        this.filePath = filePath;
        this.loadFromDisk();
    }
    save(record) {
        this.store.records[record.recordId] = record;
        this.flushToDisk();
        return record;
    }
    get(recordId) {
        return this.store.records[recordId];
    }
    query(query) {
        const results = Object.values(this.store.records)
            .filter((record) => matchesQuery(record, query))
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return query.limit ? results.slice(-query.limit) : results;
    }
    delete(recordId) {
        if (!this.store.records[recordId]) {
            return false;
        }
        delete this.store.records[recordId];
        this.flushToDisk();
        return true;
    }
    getHealth() {
        return {
            status: (0, node_fs_1.existsSync)(this.filePath) ? "healthy" : "degraded",
            backend: "sqlite-ready",
            recordCount: Object.keys(this.store.records).length,
            message: (0, node_fs_1.existsSync)(this.filePath)
                ? `Local memory file at ${this.filePath}`
                : "Local memory file not yet created",
            checkedAt: nowIso(),
            filePath: this.filePath,
        };
    }
    createSession(userId) {
        const session = {
            sessionId: nextSessionId(),
            userId,
            startedAt: nowIso(),
        };
        this.store.sessions[session.sessionId] = session;
        this.flushToDisk();
        return session;
    }
    getFilePath() {
        return this.filePath;
    }
    loadFromDisk() {
        if (!(0, node_fs_1.existsSync)(this.filePath)) {
            return;
        }
        try {
            const raw = (0, node_fs_1.readFileSync)(this.filePath, "utf-8");
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion === exports.LOCAL_MEMORY_SCHEMA_VERSION) {
                this.store = parsed;
            }
        }
        catch {
            /* ignore corrupt store in dev */
        }
    }
    flushToDisk() {
        const dir = (0, node_path_1.dirname)(this.filePath);
        if (!(0, node_fs_1.existsSync)(dir)) {
            (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        }
        (0, node_fs_1.writeFileSync)(this.filePath, JSON.stringify(this.store, null, 2), "utf-8");
    }
}
exports.FileLocalMemoryRepository = FileLocalMemoryRepository;

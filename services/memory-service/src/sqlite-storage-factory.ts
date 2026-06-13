/**
 * Isolated SQLite factory — only `require()` this module when Node SQLite is needed.
 * Electron / `JARVIS_MEMORY_BACKEND=local` must not load this file.
 */
export {
  createSqliteStorageAdapter,
  SqliteStorageAdapter,
} from "./storage-adapter/sqlite-storage-adapter";

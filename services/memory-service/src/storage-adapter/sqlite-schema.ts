/** Memory categories persisted in SQLite. */
export type MemoryCategory = "conversation" | "fact" | "task" | "reminder";

export const DEFAULT_USER_FACTS: Readonly<Record<string, string>> = {
  name: "Haseeb Rasheed",
  businesses: "GreenPlus Herbs, Ruby Travel",
  location: "Karachi, Pakistan",
  language: "Roman Urdu + English",
};

export const SQLITE_SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  importance REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  task_id TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_facts (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  memory_id UNINDEXED,
  user_id UNINDEXED,
  content,
  category,
  importance UNINDEXED,
  timestamp UNINDEXED,
  tokenize = 'porter'
);

CREATE INDEX IF NOT EXISTS idx_memories_user_category
  ON memories(user_id, category, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_time
  ON conversations(user_id, timestamp DESC);
` as const;

import type { MemoryCategory } from "./sqlite-schema";

export interface MemoryRow {
  readonly id: string;
  readonly userId: string;
  readonly content: string;
  readonly category: MemoryCategory;
  readonly timestamp: string;
  readonly importance: number;
}

export interface ConversationRow {
  readonly id: string;
  readonly userId: string;
  readonly role: string;
  readonly content: string;
  readonly taskId?: string;
  readonly timestamp: string;
}

export interface UserFactRow {
  readonly userId: string;
  readonly key: string;
  readonly value: string;
  readonly updatedAt: string;
}

export interface MemorySearchHit {
  readonly memory: MemoryRow;
  readonly score: number;
}

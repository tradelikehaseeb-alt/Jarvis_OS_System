import type { MemoryRecord } from "@jarvis/types";

import type { StorageAdapter } from "./contract";

/**
 * In-memory storage stub — not durable persistence (Phase 5).
 */
export class StorageAdapterStub implements StorageAdapter {
  readonly componentId = "storage-adapter" as const;

  private readonly store = new Map<string, MemoryRecord>();

  private key(recordId: string, userId: string): string {
    return `${userId}:${recordId}`;
  }

  async save(record: MemoryRecord): Promise<MemoryRecord> {
    this.store.set(this.key(record.id, record.userId), record);
    return record;
  }

  async load(recordId: string, userId: string): Promise<MemoryRecord | undefined> {
    return this.store.get(this.key(recordId, userId));
  }

  async remove(recordId: string, userId: string): Promise<boolean> {
    return this.store.delete(this.key(recordId, userId));
  }

  async listByUserId(userId: string): Promise<readonly MemoryRecord[]> {
    return [...this.store.values()].filter((r) => r.userId === userId);
  }
}

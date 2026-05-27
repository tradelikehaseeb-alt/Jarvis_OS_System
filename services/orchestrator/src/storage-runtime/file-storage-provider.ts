import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

import { InMemoryStorageProvider } from "./in-memory-storage-provider";
import type { StorageHealth } from "./storage-health";
import type { StorageQuery } from "./storage-query";
import type { StorageProvider } from "./storage-provider";
import type { StorageRecord } from "./storage-record";

/** Default JSON file for orchestrator memory persistence (Phase 51). */
export const DEFAULT_STORAGE_RUNTIME_FILE = join(
  __dirname,
  "..",
  "..",
  "..",
  "api-gateway",
  ".jarvis-task-store",
  "memory-records.json",
);

type StoreFileShape = Record<string, Record<string, StorageRecord>>;

/**
 * File-backed {@link StorageProvider} — JSON on disk with in-memory index at runtime.
 */
export class FileStorageProvider implements StorageProvider {
  readonly providerId = "file" as const;

  private readonly backing = new InMemoryStorageProvider();

  constructor(private readonly filePath: string = DEFAULT_STORAGE_RUNTIME_FILE) {
    this.loadFromDisk();
  }

  save(record: StorageRecord): StorageRecord {
    const saved = this.backing.save(record);
    this.flushToDisk();
    return saved;
  }

  get(id: string, namespace: string): StorageRecord | undefined {
    return this.backing.get(id, namespace);
  }

  query(query: StorageQuery): readonly StorageRecord[] {
    return this.backing.query(query);
  }

  delete(id: string, namespace: string): boolean {
    const deleted = this.backing.delete(id, namespace);
    if (deleted) {
      this.flushToDisk();
    }
    return deleted;
  }

  getHealth(): StorageHealth {
    const health = this.backing.getHealth();
    return {
      ...health,
      providerId: this.providerId,
      message: existsSync(this.filePath)
        ? `File store at ${this.filePath}`
        : "File store not yet created",
    };
  }

  /** Resolved file path (for tests and diagnostics). */
  getFilePath(): string {
    return this.filePath;
  }

  private loadFromDisk(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(raw) as StoreFileShape;
      for (const namespaceRecords of Object.values(data)) {
        for (const record of Object.values(namespaceRecords)) {
          this.backing.save(record);
        }
      }
    } catch {
      /* ignore corrupt store in dev */
    }
  }

  private flushToDisk(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const data: StoreFileShape = {};
    for (const record of this.backing.query({})) {
      if (!data[record.namespace]) {
        data[record.namespace] = {};
      }
      data[record.namespace]![record.id] = record;
    }

    writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

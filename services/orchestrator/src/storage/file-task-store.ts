import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { InMemoryTaskStore } from "./in-memory-task-store";
import type { TaskExecutionRecord } from "./task-record";
import type { TaskStore } from "./task-store";

/** Default JSON file for CLI bridge subprocesses (Phase 14–15). */
export const DEFAULT_BRIDGE_TASK_STORE_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "api-gateway",
  ".jarvis-task-store",
  "tasks.json",
);

type StoreFileShape = Record<string, TaskExecutionRecord>;

/**
 * File-backed {@link TaskStore} — JSON on disk, in-memory index at runtime.
 *
 * Each CLI bridge invocation shares the same file path so `createTask` and
 * `getTaskStatus` see consistent state across subprocesses.
 */
export class FileTaskStore implements TaskStore {
  readonly storeId = "file-task-store" as const;

  private readonly backing = new InMemoryTaskStore();

  constructor(private readonly filePath: string = DEFAULT_BRIDGE_TASK_STORE_FILE) {
    this.loadFromDisk();
  }

  save(record: TaskExecutionRecord): void {
    this.backing.save(record);
    this.flushToDisk();
  }

  get(taskId: string): TaskExecutionRecord | undefined {
    return this.backing.get(taskId);
  }

  has(taskId: string): boolean {
    return this.backing.has(taskId);
  }

  listTaskIds(): readonly string[] {
    return this.backing.listTaskIds();
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
      for (const record of Object.values(data)) {
        this.backing.save(record);
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
    for (const taskId of this.backing.listTaskIds()) {
      const record = this.backing.get(taskId);
      if (record) {
        data[taskId] = record;
      }
    }
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

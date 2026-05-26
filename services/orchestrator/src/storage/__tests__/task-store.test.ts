import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import type { TaskExecutionRecord } from "../task-record";
import { FileTaskStore } from "../file-task-store";
import { InMemoryTaskStore } from "../in-memory-task-store";
import {
  TaskStoreFactory,
  resetSharedTaskStore,
} from "../task-store-factory";

const sampleRecord = (taskId: string): TaskExecutionRecord => ({
  createTaskResponse: {
    taskId,
    status: "completed",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  taskStatus: {
    taskId,
    status: "completed",
    progressPercent: 100,
    output: { stub: true },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
});

describe("InMemoryTaskStore", () => {
  it("saves and retrieves records", () => {
    const store = new InMemoryTaskStore();
    const record = sampleRecord("task-mem-1");
    store.save(record);
    expect(store.has("task-mem-1")).toBe(true);
    expect(store.get("task-mem-1")).toEqual(record);
    expect(store.listTaskIds()).toContain("task-mem-1");
  });

  it("returns undefined for unknown task", () => {
    const store = new InMemoryTaskStore();
    expect(store.get("missing")).toBeUndefined();
  });
});

describe("FileTaskStore", () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("persists records to disk and reloads", () => {
    tempDir = mkdtempSync(join(tmpdir(), "jarvis-task-store-"));
    const filePath = join(tempDir, "tasks.json");

    const storeA = new FileTaskStore(filePath);
    storeA.save(sampleRecord("task-file-1"));

    const storeB = new FileTaskStore(filePath);
    expect(storeB.get("task-file-1")?.createTaskResponse.status).toBe("completed");

    const raw = readFileSync(filePath, "utf-8");
    expect(raw).toContain("task-file-1");
  });

  it("overwrites existing task id on save", () => {
    tempDir = mkdtempSync(join(tmpdir(), "jarvis-task-store-"));
    const filePath = join(tempDir, "tasks.json");
    const store = new FileTaskStore(filePath);

    store.save(sampleRecord("task-file-2"));
    store.save({
      ...sampleRecord("task-file-2"),
      taskStatus: {
        ...sampleRecord("task-file-2").taskStatus,
        progressPercent: 50,
      },
    });

    expect(store.get("task-file-2")?.taskStatus.progressPercent).toBe(50);
  });
});

describe("TaskStoreFactory", () => {
  afterEach(() => {
    resetSharedTaskStore();
  });

  it("create returns in-memory store", () => {
    const store = TaskStoreFactory.create({ kind: "memory" });
    expect(store.storeId).toBe("in-memory-task-store");
  });

  it("create returns file store with custom path", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "jarvis-factory-"));
    const filePath = join(tempDir, "custom.json");
    const store = TaskStoreFactory.create({ kind: "file", filePath });
    expect(store.storeId).toBe("file-task-store");
    store.save(sampleRecord("task-factory-1"));
    expect(existsSync(filePath)).toBe(true);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("getSharedDefault returns singleton file store", () => {
    const a = TaskStoreFactory.getSharedDefault();
    const b = TaskStoreFactory.getSharedDefault();
    expect(a).toBe(b);
    expect(a.storeId).toBe("file-task-store");
  });
});

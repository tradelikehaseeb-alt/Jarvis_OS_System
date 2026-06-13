import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LOCAL_MEMORY_JSON_FILENAME,
  ensureLocalMemoryDirectory,
  resolveLocalMemoryDirectory,
  resolveLocalMemoryFilePath,
  resolveLocalMemoryStorage,
} from "../resolve-local-memory-storage";
import { createDefaultLocalMemoryRuntime } from "../create-default-local-memory-runtime";

describe("resolveLocalMemoryStorage", () => {
  it("defaults to file storage when MEMORY_USE_IN_MEMORY_STORAGE is unset", () => {
    const resolved = resolveLocalMemoryStorage({
      env: {
        JARVIS_MEMORY_PATH: "C:/tmp/jarvis-memory-test",
      },
    });

    expect(resolved.useFileBackend).toBe(true);
    expect(resolved.filePath).toContain(LOCAL_MEMORY_JSON_FILENAME);
  });

  it("uses in-memory storage only when MEMORY_USE_IN_MEMORY_STORAGE=true", () => {
    const resolved = resolveLocalMemoryStorage({
      env: {
        MEMORY_USE_IN_MEMORY_STORAGE: "true",
      },
    });

    expect(resolved.useFileBackend).toBe(false);
  });

  it("creates the configured memory directory", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "jarvis-memory-dir-"));
    const memoryDir = join(tempRoot, "nested", "memory");

    try {
      ensureLocalMemoryDirectory(memoryDir);
      expect(existsSync(memoryDir)).toBe(true);
      expect(resolveLocalMemoryFilePath({ JARVIS_MEMORY_PATH: memoryDir })).toBe(
        join(memoryDir, LOCAL_MEMORY_JSON_FILENAME),
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("persists records through createDefaultLocalMemoryRuntime using JARVIS_MEMORY_PATH", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "jarvis-memory-runtime-"));
    const memoryDir = join(tempRoot, "memory");
    const filePath = join(memoryDir, LOCAL_MEMORY_JSON_FILENAME);

    try {
      const runtime = createDefaultLocalMemoryRuntime({
        filePath,
        useFileBackend: true,
        env: {
          JARVIS_MEMORY_PATH: memoryDir,
          MEMORY_USE_IN_MEMORY_STORAGE: "false",
        },
      });

      runtime.saveMemory({
        recordId: "rec-persist-1",
        type: "conversation",
        userId: "user-1",
        timestamp: "2026-05-30T12:00:00.000Z",
        conversationId: "conv-1",
        content: { message: "favorite color is blue" },
        schemaVersion: 1,
      });

      expect(existsSync(filePath)).toBe(true);

      const reloaded = createDefaultLocalMemoryRuntime({
        filePath,
        useFileBackend: true,
        env: {
          JARVIS_MEMORY_PATH: memoryDir,
          MEMORY_USE_IN_MEMORY_STORAGE: "false",
        },
      });

      expect(reloaded.getMemory("rec-persist-1")?.content).toEqual({
        message: "favorite color is blue",
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("falls back to ~/.hermes/memory when JARVIS_MEMORY_PATH is unset", () => {
    const resolved = resolveLocalMemoryDirectory({});
    expect(resolved).toContain(".hermes");
    expect(resolved).toContain("memory");
  });
});

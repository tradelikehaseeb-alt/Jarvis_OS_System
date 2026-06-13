import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import http from "node:http";

import { createMemoryComponents } from "../create-memory-service";
import { DefaultMemoryApiService } from "../memory-api/default-memory-api-service";
import { handleMemoryHttpRequest } from "../memory-api/http-handler";
import { resetSharedJarvisMemoryClient } from "../jarvis-memory-client";
import { JARVIS_DB_FILENAME } from "../storage-adapter/memory-path";
import {
  SqliteStorageAdapter,
} from "../storage-adapter/sqlite-storage-adapter";

function isSqliteBindingsAvailable(): boolean {
  try {
    const Database = require("better-sqlite3") as new (path: string) => {
      close(): void;
    };
    const db = new Database(":memory:");
    db.close();
    return true;
  } catch {
    return false;
  }
}

const sqliteBindingsAvailable = isSqliteBindingsAvailable();

describe.skipIf(!sqliteBindingsAvailable)("SQLite memory service", () => {
  let tempDir = "";
  const openAdapters: SqliteStorageAdapter[] = [];

  beforeEach(() => {
    resetSharedJarvisMemoryClient();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jarvis-mem-test-"));
  });

  afterEach(() => {
    resetSharedJarvisMemoryClient();
    for (const adapter of openAdapters.splice(0)) {
      adapter.close();
    }
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Windows may keep WAL handles briefly after close
      }
    }
  });

  function dbPath(): string {
    return path.join(tempDir, JARVIS_DB_FILENAME);
  }

  function createService(): DefaultMemoryApiService {
    const storage = new SqliteStorageAdapter({
      dbPath: dbPath(),
      env: {
        JARVIS_MEMORY_PATH: tempDir,
        JARVIS_MEMORY_BACKEND: "memory-service",
        NODE_ENV: "development",
      },
    });
    openAdapters.push(storage);
    const components = createMemoryComponents({
      storageAdapter: storage,
      env: { JARVIS_MEMORY_PATH: tempDir, JARVIS_MEMORY_BACKEND: "memory-service" },
    });
    return new DefaultMemoryApiService(components);
  }

  it("creates SQLite file at configured path", () => {
    createService();
    expect(fs.existsSync(dbPath())).toBe(true);
  });

  it("save and retrieve memory", async () => {
    const service = createService();
    const stored = await service.saveMemoryContent(
      "default",
      "User prefers dark mode UI",
      "fact",
      0.8,
    );
    const row = await service.provider.get(stored.id, "default");
    expect(row?.content).toContain("dark mode");
  });

  it("search finds relevant memories", async () => {
    const service = createService();
    await service.saveMemoryContent("default", "Gold price is rising", "fact");
    await service.saveMemoryContent("default", "Weather in Karachi is sunny", "fact");
    const hits = await service.searchMemories("default", "gold price", 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.record.content.toLowerCase()).toContain("gold");
  });

  it("user facts persist after restart", async () => {
    const first = createService();
    const seeded = await first.getUserFact("default", "name");
    expect(seeded).toBe("Haseeb Rasheed");

    await first.saveUserFact("default", "nickname", "Haseeb");
    const second = createService();
    expect(await second.getUserFact("default", "nickname")).toBe("Haseeb");
    expect(await second.getUserFact("default", "location")).toBe(
      "Karachi, Pakistan",
    );
  });

  it("HTTP API returns correct responses", async () => {
    const service = createService();
    const server = http.createServer((req, res) => {
      void handleMemoryHttpRequest(service, req, res);
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port =
      typeof address === "object" && address ? address.port : 0;

    const saveResponse = await fetch(`http://127.0.0.1:${port}/memory/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Meeting at 3pm",
        category: "reminder",
      }),
    });
    expect(saveResponse.status).toBe(201);

    const searchResponse = await fetch(
      `http://127.0.0.1:${port}/memory/search?q=meeting&userId=default`,
    );
    expect(searchResponse.status).toBe(200);
    const searchPayload = (await searchResponse.json()) as {
      results: Array<{ record: { content: string } }>;
    };
    expect(searchPayload.results[0]?.record.content).toContain("Meeting");

    const factsResponse = await fetch(
      `http://127.0.0.1:${port}/memory/facts?userId=default`,
    );
    expect(factsResponse.status).toBe(200);

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("getRecentConversations returns last messages", async () => {
    const service = createService();
    const storage = service.components.storageAdapter as {
      saveConversation: (input: {
        userId: string;
        role: string;
        content: string;
      }) => Promise<unknown>;
    };
    await storage.saveConversation({
      userId: "user-1",
      role: "user",
      content: "Hello Jarvis",
    });
    await storage.saveConversation({
      userId: "user-1",
      role: "assistant",
      content: "Hello Haseeb",
    });

    const recent = await service.getRecentConversations("user-1", 10);
    expect(recent.length).toBe(2);
    const contents = recent.map((row) => row.content);
    expect(contents.some((line) => line.includes("Hello Haseeb"))).toBe(true);
    expect(contents.some((line) => line.includes("Hello Jarvis"))).toBe(true);
  });
});

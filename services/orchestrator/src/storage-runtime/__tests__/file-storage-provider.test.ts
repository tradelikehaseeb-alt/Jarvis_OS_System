import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FileStorageProvider } from "../file-storage-provider";

describe("FileStorageProvider", () => {
  it("persists records to disk and reloads on new instance", () => {
    const dir = mkdtempSync(join(tmpdir(), "jarvis-storage-"));
    const filePath = join(dir, "records.json");

    try {
      const writer = new FileStorageProvider(filePath);
      writer.save({
        id: "mem-1",
        namespace: "jarvis.memory",
        timestamp: "2026-01-01T00:00:01.000Z",
        data: { recordId: "mem-1", type: "conversation", userId: "user-1" },
        metadata: { userId: "user-1", type: "conversation" },
      });

      const reader = new FileStorageProvider(filePath);
      const loaded = reader.get("mem-1", "jarvis.memory");

      expect(loaded?.data.recordId).toBe("mem-1");
      expect(reader.getHealth().providerId).toBe("file");
      expect(reader.delete("mem-1", "jarvis.memory")).toBe(true);
      expect(reader.get("mem-1", "jarvis.memory")).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

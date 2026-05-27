import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach } from "vitest";

const tempDirs: string[] = [];

/**
 * Creates a tracked temp directory removed in afterEach (Phase 62 test cleanup).
 */
export function createTestTempDir(prefix = "jarvis-memory-test-"): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (!dir) {
      continue;
    }

    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    } catch {
      /* best-effort cleanup on Windows file locks */
    }
  }
});

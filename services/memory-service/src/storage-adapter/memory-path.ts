import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Default memory directory under Hermes home. */
export const DEFAULT_MEMORY_DIR = path.join(os.homedir(), ".hermes", "memory");

/** SQLite database filename. */
export const JARVIS_DB_FILENAME = "jarvis.db" as const;

/**
 * Resolves directory for Jarvis memory (`JARVIS_MEMORY_PATH` or `~/.hermes/memory`).
 */
export function resolveMemoryDirectory(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const configured = env.JARVIS_MEMORY_PATH?.trim();
  if (configured && configured.length > 0) {
    return path.resolve(configured);
  }
  return DEFAULT_MEMORY_DIR;
}

/**
 * Full path to `jarvis.db`.
 */
export function resolveDatabasePath(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  return path.join(resolveMemoryDirectory(env), JARVIS_DB_FILENAME);
}

/**
 * Ensures memory directory exists.
 */
export function ensureMemoryDirectory(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const dir = resolveMemoryDirectory(env);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

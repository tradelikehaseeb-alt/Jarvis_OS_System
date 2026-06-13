import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { DEFAULT_LOCAL_MEMORY_FILE } from "./file-local-memory-repository";

/** JSON store filename under {@link resolveLocalMemoryDirectory}. */
export const LOCAL_MEMORY_JSON_FILENAME = "local-memory.json" as const;

const DEFAULT_MEMORY_DIR = join(homedir(), ".hermes", "memory");

export interface ResolveLocalMemoryStorageOptions {
  readonly filePath?: string;
  readonly useFileBackend?: boolean;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

export interface ResolvedLocalMemoryStorage {
  readonly filePath: string;
  readonly useFileBackend: boolean;
  readonly memoryDirectory: string;
}

/**
 * Resolves the directory for Jarvis local memory (`JARVIS_MEMORY_PATH` or `~/.hermes/memory`).
 */
export function resolveLocalMemoryDirectory(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const configured = env.JARVIS_MEMORY_PATH?.trim();
  if (configured && configured.length > 0) {
    return resolve(configured);
  }
  return DEFAULT_MEMORY_DIR;
}

/**
 * Ensures the memory directory exists before file writes (safe for Electron bootstrap).
 */
export function ensureLocalMemoryDirectory(directory: string): string {
  const normalized = resolve(directory);
  if (!existsSync(normalized)) {
    mkdirSync(normalized, { recursive: true });
  }
  return normalized;
}

/**
 * Full path to the JSON local-memory store file.
 */
export function resolveLocalMemoryFilePath(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const directory = ensureLocalMemoryDirectory(resolveLocalMemoryDirectory(env));
  return join(directory, LOCAL_MEMORY_JSON_FILENAME);
}

function shouldUseInMemoryStorage(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return env.MEMORY_USE_IN_MEMORY_STORAGE?.trim().toLowerCase() === "true";
}

/**
 * Resolves file path and backend mode from env and explicit runtime options.
 */
export function resolveLocalMemoryStorage(
  options: ResolveLocalMemoryStorageOptions = {},
): ResolvedLocalMemoryStorage {
  const env = options.env ?? process.env;
  const memoryDirectory = resolveLocalMemoryDirectory(env);
  const useFileBackend =
    options.useFileBackend ?? !shouldUseInMemoryStorage(env);
  const filePath =
    options.filePath ??
    (useFileBackend ? resolveLocalMemoryFilePath(env) : DEFAULT_LOCAL_MEMORY_FILE);

  if (useFileBackend) {
    ensureLocalMemoryDirectory(dirname(filePath));
  }

  return {
    filePath,
    useFileBackend,
    memoryDirectory,
  };
}

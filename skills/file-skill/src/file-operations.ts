import fs from "node:fs";
import path from "node:path";

import {
  FILE_READ_LIMIT_BYTES,
  resolveSafeWorkspacePath,
  resolveWorkspaceRoot,
} from "./workspace-path";

export interface FileOperationLogEntry {
  readonly operation: string;
  readonly path: string;
  readonly timestamp: string;
  readonly success: boolean;
  readonly detail?: string;
}

const operationLog: FileOperationLogEntry[] = [];

export function getFileOperationLog(): readonly FileOperationLogEntry[] {
  return operationLog;
}

export function clearFileOperationLog(): void {
  operationLog.length = 0;
}

function logOperation(
  operation: string,
  relativePath: string,
  success: boolean,
  detail?: string,
): void {
  operationLog.push({
    operation,
    path: relativePath,
    timestamp: new Date().toISOString(),
    success,
    detail,
  });
  const status = success ? "ok" : "error";
  console.info(
    `[file-skill] ${operation} ${relativePath} ${status}${detail ? ` — ${detail}` : ""}`,
  );
}

export function readWorkspaceFile(userPath: string): {
  readonly content: string;
  readonly bytes: number;
  readonly path: string;
} {
  const resolved = resolveSafeWorkspacePath(userPath);
  if (!fs.existsSync(resolved.absolutePath)) {
    logOperation("read", resolved.relativePath, false, "not found");
    throw new Error("FILE_NOT_FOUND");
  }
  const stat = fs.statSync(resolved.absolutePath);
  if (!stat.isFile()) {
    logOperation("read", resolved.relativePath, false, "not a file");
    throw new Error("NOT_A_FILE");
  }
  if (stat.size > FILE_READ_LIMIT_BYTES) {
    logOperation("read", resolved.relativePath, false, "too large");
    throw new Error("FILE_TOO_LARGE");
  }
  const content = fs.readFileSync(resolved.absolutePath, "utf8");
  logOperation("read", resolved.relativePath, true, `${stat.size} bytes`);
  return { content, bytes: stat.size, path: resolved.relativePath };
}

export function writeWorkspaceFile(
  userPath: string,
  content: string,
): { readonly path: string; readonly bytes: number } {
  const resolved = resolveSafeWorkspacePath(userPath);
  fs.mkdirSync(path.dirname(resolved.absolutePath), { recursive: true });
  const buffer = Buffer.from(content, "utf8");
  if (buffer.length > FILE_READ_LIMIT_BYTES) {
    logOperation("write", resolved.relativePath, false, "too large");
    throw new Error("FILE_TOO_LARGE");
  }
  fs.writeFileSync(resolved.absolutePath, buffer);
  logOperation("write", resolved.relativePath, true, `${buffer.length} bytes`);
  return { path: resolved.relativePath, bytes: buffer.length };
}

export function listWorkspaceDirectory(userPath = "."): {
  readonly entries: readonly { name: string; type: "file" | "directory" }[];
  readonly path: string;
} {
  const resolved = resolveSafeWorkspacePath(userPath);
  if (!fs.existsSync(resolved.absolutePath)) {
    logOperation("list", resolved.relativePath, false, "not found");
    throw new Error("DIRECTORY_NOT_FOUND");
  }
  const stat = fs.statSync(resolved.absolutePath);
  if (!stat.isDirectory()) {
    logOperation("list", resolved.relativePath, false, "not a directory");
    throw new Error("NOT_A_DIRECTORY");
  }
  const entries = fs.readdirSync(resolved.absolutePath, { withFileTypes: true }).map(
    (entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? ("directory" as const) : ("file" as const),
    }),
  );
  logOperation("list", resolved.relativePath, true, `${entries.length} entries`);
  return { entries, path: resolved.relativePath };
}

export function deleteWorkspaceFile(userPath: string): { readonly path: string } {
  const resolved = resolveSafeWorkspacePath(userPath);
  if (!fs.existsSync(resolved.absolutePath)) {
    logOperation("delete", resolved.relativePath, false, "not found");
    throw new Error("FILE_NOT_FOUND");
  }
  fs.rmSync(resolved.absolutePath, { recursive: true, force: true });
  logOperation("delete", resolved.relativePath, true);
  return { path: resolved.relativePath };
}

export function createWorkspaceDirectory(userPath: string): { readonly path: string } {
  const resolved = resolveSafeWorkspacePath(userPath);
  fs.mkdirSync(resolved.absolutePath, { recursive: true });
  logOperation("mkdir", resolved.relativePath, true);
  return { path: resolved.relativePath };
}

export function searchWorkspaceFiles(query: string): {
  readonly matches: readonly { path: string; name: string }[];
  readonly query: string;
} {
  const root = resolveWorkspaceRoot();
  const normalizedQuery = query.trim().toLowerCase();
  const matches: { path: string; name: string }[] = [];

  const walk = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (
        normalizedQuery.length === 0 ||
        entry.name.toLowerCase().includes(normalizedQuery)
      ) {
        matches.push({
          path: path.relative(root, absolute),
          name: entry.name,
        });
      }
    }
  };

  if (fs.existsSync(root)) {
    walk(root);
  }

  logOperation("search", ".", true, `${matches.length} matches for "${query}"`);
  return { matches, query };
}

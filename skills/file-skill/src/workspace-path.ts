import fs from "node:fs";
import path from "node:path";

const DEFAULT_WORKSPACE = path.join(process.cwd(), "workspace");
const MAX_READ_BYTES = 10 * 1024 * 1024;

const BLOCKED_PREFIXES = [
  String.raw`C:\Windows`,
  String.raw`C:\Program Files`,
  "/etc",
  "/usr",
  "/bin",
  "/sbin",
  "/var",
  "/System",
  "/Library",
] as const;

export interface ResolvedWorkspacePath {
  readonly absolutePath: string;
  readonly relativePath: string;
}

/**
 * Resolves JARVIS_WORKSPACE_PATH (default: <repo>/workspace).
 */
export function resolveWorkspaceRoot(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configured = env.JARVIS_WORKSPACE_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.resolve(DEFAULT_WORKSPACE);
}

function containsTraversal(segmentPath: string): boolean {
  const normalized = segmentPath.replace(/\\/g, "/");
  return (
    normalized.includes("..") ||
    normalized.includes("\0") ||
    /^[a-zA-Z]:/.test(normalized) && normalized.includes("..")
  );
}

function isBlockedSystemPath(absolutePath: string): boolean {
  const normalized = path.normalize(absolutePath);
  for (const blocked of BLOCKED_PREFIXES) {
    if (normalized.toLowerCase().startsWith(blocked.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Validates and resolves a user path inside the workspace root.
 */
export function resolveSafeWorkspacePath(
  userPath: string,
  workspaceRoot: string = resolveWorkspaceRoot(),
): ResolvedWorkspacePath {
  const trimmed = userPath.trim();
  if (!trimmed) {
    throw new Error("PATH_REQUIRED");
  }
  if (containsTraversal(trimmed)) {
    throw new Error("PATH_TRAVERSAL_BLOCKED");
  }

  const root = path.resolve(workspaceRoot);
  const absolutePath = path.resolve(root, trimmed.replace(/^[/\\]+/, ""));

  if (!absolutePath.startsWith(root + path.sep) && absolutePath !== root) {
    throw new Error("PATH_OUTSIDE_WORKSPACE");
  }
  if (isBlockedSystemPath(absolutePath)) {
    throw new Error("PATH_SYSTEM_BLOCKED");
  }

  const relativePath = path.relative(root, absolutePath) || ".";
  return { absolutePath, relativePath };
}

export function ensureWorkspaceExists(workspaceRoot?: string): string {
  const root = workspaceRoot ?? resolveWorkspaceRoot();
  fs.mkdirSync(root, { recursive: true });
  return root;
}

export const FILE_READ_LIMIT_BYTES = MAX_READ_BYTES;

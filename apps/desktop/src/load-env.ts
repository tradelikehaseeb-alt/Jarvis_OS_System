import fs from "node:fs";
import path from "node:path";

function parseEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return undefined;
  }

  const eq = trimmed.indexOf("=");
  if (eq <= 0) {
    return undefined;
  }

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function applyEnvFile(contents: string): string | undefined {
  let loadedFrom: string | undefined;
  for (const line of contents.split(/\r?\n/u)) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
  return loadedFrom;
}

function envFileCandidates(startDir: string): readonly string[] {
  const candidates: string[] = [];
  let current = path.resolve(startDir);

  for (let depth = 0; depth < 5; depth += 1) {
    candidates.push(path.join(current, ".env"));
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return candidates;
}

/**
 * Loads `.env` from the monorepo root for Electron main / embedded API runtime.
 * Existing process.env values are never overwritten.
 */
export function loadJarvisEnv(startDir = process.cwd()): string | undefined {
  for (const filePath of envFileCandidates(startDir)) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    applyEnvFile(fs.readFileSync(filePath, "utf8"));
    return filePath;
  }

  return undefined;
}

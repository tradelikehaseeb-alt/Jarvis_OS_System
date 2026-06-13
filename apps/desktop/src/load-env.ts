import fs from "node:fs";
import path from "node:path";

import { config as loadDotenv } from "dotenv";

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

function applyEnvFile(contents: string): void {
  for (const line of contents.split(/\r?\n/u)) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

/** Monorepo root from compiled `dist/load-env.js` (apps/desktop/dist → ../../../). */
export function resolveMonorepoRootFromMain(mainDirname: string): string {
  return path.resolve(mainDirname, "../../..");
}

function envFileCandidates(startDir: string): readonly string[] {
  const candidates: string[] = [];
  let current = path.resolve(startDir);

  for (let depth = 0; depth < 6; depth += 1) {
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
 * Uses `dotenv` first, then a line parser for keys still unset.
 */
export function loadJarvisEnv(startDir?: string): string | undefined {
  const resolvedStart = startDir
    ? path.resolve(startDir)
    : resolveMonorepoRootFromMain(path.join(__dirname));

  const rootEnv = path.join(resolvedStart, ".env");
  if (fs.existsSync(rootEnv)) {
    loadDotenv({ path: rootEnv });
    applyEnvFile(fs.readFileSync(rootEnv, "utf8"));
    return rootEnv;
  }

  for (const filePath of envFileCandidates(resolvedStart)) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    loadDotenv({ path: filePath });
    applyEnvFile(fs.readFileSync(filePath, "utf8"));
    return filePath;
  }

  return undefined;
}

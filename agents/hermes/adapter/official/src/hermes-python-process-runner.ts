import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { HermesSkillCategory } from "./get-hermes-execution-mode";
import { resolveHermesUserStatusMessage } from "./get-hermes-execution-mode";

const FINAL_RESPONSE_MARKER = "FINAL RESPONSE:";
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_QUERY_CHARS = 8_000;
const MAX_AGENT_RETRIES = 3;
const UNKNOWN_EXIT_RETRY_DELAY_MS = 3_000;
const RATE_LIMIT_RETRY_DELAY_MS = 15_000;
export const HERMES_RESTART_USER_MESSAGE =
  "Jarvis is restarting, please wait...";
export const HERMES_RATE_LIMIT_USER_MESSAGE = "Thoda wait karo...";
export const HERMES_MAX_RETRIES_USER_MESSAGE =
  "Jarvis could not recover after multiple attempts. Please try again in a moment.";

const TOOL_OUTPUT_LINE =
  /^(tool[\s:_-]|calling tool|function call|tool_call|tool result|tool output)/i;
const ASSISTANT_LINE =
  /^(assistant|jarvis|hermes|final response|🎯)/i;

let cachedAgentRoot: string | null = null;
let agentRootLoggedThisSession = false;

export interface RunHermesAgentProcessOptions {
  readonly agentRoot: string;
  readonly query: string;
  readonly pythonExecutable?: string;
  readonly pythonVersionFlag?: string;
  readonly enabledToolsets?: string;
  readonly timeoutMs?: number;
  readonly env?: NodeJS.ProcessEnv;
  readonly skillCategory?: HermesSkillCategory;
  readonly userStatusMessage?: string;
  /** Max subprocess retries after failure (default 3). Use 0 for immediate fallback. */
  readonly maxRetries?: number;
}

export interface RunHermesAgentProcessResult {
  readonly success: boolean;
  readonly finalResponse: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly userStatusMessage?: string;
  readonly retryAttempts?: number;
  readonly skillCategory?: HermesSkillCategory;
}

export function resetHermesAgentRootCacheForTests(): void {
  cachedAgentRoot = null;
  agentRootLoggedThisSession = false;
}

export function resolveHermesAgentRoot(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  if (
    cachedAgentRoot &&
    existsSync(join(cachedAgentRoot, "run_agent.py"))
  ) {
    return cachedAgentRoot;
  }

  const candidates = [
    env.HERMES_AGENT_PATH?.trim(),
    env.HERMES_PATH?.trim(),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const normalized = candidate.replace(/[\\/]+$/, "");
    const scriptPath = join(normalized, "run_agent.py");
    if (existsSync(scriptPath)) {
      cachedAgentRoot = normalized;
      if (!agentRootLoggedThisSession) {
        console.info("[hermes-python] resolved agent root:", normalized);
        agentRootLoggedThisSession = true;
      }
      return normalized;
    }
    console.warn(
      "[hermes-python] run_agent.py missing under candidate:",
      normalized,
    );
  }

  console.error(
    "[hermes-python] HERMES_AGENT_PATH / HERMES_PATH invalid — no run_agent.py found",
    { HERMES_AGENT_PATH: env.HERMES_AGENT_PATH, HERMES_PATH: env.HERMES_PATH },
  );
  return "";
}

export function hasGroqCredentialsForHermesAgent(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return Boolean(
    env.GROQ_API_KEY?.trim() ||
      env.JARVIS_GROQ_API_KEY?.trim(),
  );
}

/** Strip tool-call noise from assistant text. */
export function stripHermesToolOutputs(text: string): string {
  return text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/Tool (call|result|output):[^\n]*/gi, "")
    .replace(/Calling tool[^\n]*/gi, "")
    .replace(/function_call[^\n]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract assistant text from `run_agent.py` CLI output (banner `FINAL RESPONSE:`).
 */
export function parseFinalResponseFromStdout(stdout: string): string {
  const normalized = stdout.replace(/\r\n/g, "\n");
  const markerIndex = normalized.indexOf(FINAL_RESPONSE_MARKER);
  if (markerIndex < 0) {
    return "";
  }

  let body = normalized.slice(markerIndex + FINAL_RESPONSE_MARKER.length);
  body = body.replace(/^[\s🎯:\-]+/u, "");
  const divider = body.indexOf("\n----");
  if (divider >= 0) {
    body = body.slice(divider).replace(/^[\s\-]+/, "");
  }

  const endMarkers = [
    "\n\n=",
    "\n👋 Agent execution",
    "\nAgent execution completed",
  ];
  let end = body.length;
  for (const marker of endMarkers) {
    const idx = body.indexOf(marker);
    if (idx >= 0) {
      end = Math.min(end, idx);
    }
  }

  return stripHermesToolOutputs(body.slice(0, end).trim());
}

/** Fallback: last non-tool assistant line from subprocess stdout. */
export function parseLastAssistantMessageFromStdout(stdout: string): string {
  const lines = stdout
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const candidates = lines.filter(
    (line) =>
      !TOOL_OUTPUT_LINE.test(line) &&
      !line.startsWith("[") &&
      !line.startsWith("{") &&
      line.length > 8,
  );

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const line = candidates[index]!;
    if (ASSISTANT_LINE.test(line)) {
      return stripHermesToolOutputs(
        line.replace(/^(assistant|jarvis|hermes):\s*/i, "").trim(),
      );
    }
  }

  const last = candidates.at(-1) ?? "";
  return stripHermesToolOutputs(last);
}

/**
 * Parse Hermes subprocess stdout — FINAL RESPONSE marker, then assistant fallback.
 */
export function parseHermesAgentStdout(stdout: string): string {
  const fromMarker = parseFinalResponseFromStdout(stdout);
  if (fromMarker) {
    return fromMarker;
  }
  return parseLastAssistantMessageFromStdout(stdout);
}

export function isHermesAgentRateLimitError(
  stderr: string,
  stdout = "",
): boolean {
  const combined = `${stderr}\n${stdout}`.toLowerCase();
  return (
    combined.includes("rate limit") ||
    combined.includes("rate_limit") ||
    combined.includes("too many requests") ||
    combined.includes("connection error") ||
    combined.includes("authentication") ||
    combined.includes("auth exhaustion") ||
    combined.includes("quota") ||
    combined.includes("exhausted") ||
    /\b429\b/.test(combined)
  );
}

export function isHermesAgentUnknownExitError(
  exitCode: number | null,
  errorMessage?: string,
): boolean {
  if (exitCode === null) {
    return true;
  }
  const normalized = (errorMessage ?? "").toLowerCase();
  return normalized.includes("unknown");
}

export function resolveHermesAgentRetryDelayMs(
  stderr: string,
  stdout = "",
): number {
  return isHermesAgentRateLimitError(stderr, stdout)
    ? RATE_LIMIT_RETRY_DELAY_MS
    : UNKNOWN_EXIT_RETRY_DELAY_MS;
}

/** True when subprocess stdout/stderr is a user-facing API failure blob. */
export function isHermesAgentApiFailureText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.includes("api call failed after") ||
    normalized.includes("rate limit reached") ||
    normalized.includes("http 429") ||
    normalized.startsWith("fetch failed")
  );
}

/** True when Python agent failed due to outbound network/API errors. */
export function isHermesAgentNetworkError(
  result: Pick<
    RunHermesAgentProcessResult,
    "stderr" | "stdout" | "errorMessage" | "errorCode"
  >,
): boolean {
  const haystack = [
    result.stderr,
    result.stdout,
    result.errorMessage ?? "",
    result.errorCode ?? "",
  ]
    .join("\n")
    .toLowerCase();

  return (
    haystack.includes("fetch failed") ||
    haystack.includes("econnrefused") ||
    haystack.includes("enotfound") ||
    haystack.includes("network") ||
    haystack.includes("connection error") ||
    haystack.includes("timed out")
  );
}

export function shouldRetryHermesAgentProcess(
  result: RunHermesAgentProcessResult,
): boolean {
  if (result.success) {
    return false;
  }
  if (
    result.errorCode === "HERMES_AGENT_SCRIPT_MISSING" ||
    result.errorCode === "HERMES_QUERY_EMPTY"
  ) {
    return false;
  }
  return (
    isHermesAgentRateLimitError(result.stderr, result.stdout) ||
    isHermesAgentUnknownExitError(result.exitCode, result.errorMessage)
  );
}

function parsePythonCommand(
  env: Readonly<Record<string, string | undefined>>,
  overrideExecutable?: string,
  overrideVersionFlag?: string,
): { executable: string; prefixArgs: string[] } {
  const configured = overrideExecutable?.trim() || env.HERMES_PYTHON?.trim();
  if (configured) {
    const parts = configured.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return { executable: parts[0]!, prefixArgs: parts.slice(1) };
    }
    return { executable: parts[0] ?? "python", prefixArgs: [] };
  }

  const versionFlag =
    overrideVersionFlag?.trim() || env.HERMES_PYTHON_VERSION?.trim() || "-3.11";
  return { executable: "py", prefixArgs: [versionFlag] };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveInitialStatusMessage(
  options: RunHermesAgentProcessOptions,
): string {
  if (options.userStatusMessage?.trim()) {
    return options.userStatusMessage.trim();
  }
  if (options.skillCategory) {
    return resolveHermesUserStatusMessage(options.skillCategory);
  }
  return resolveHermesUserStatusMessage("general");
}

/** Internal bindings — overridable in tests for retry behavior. */
export const hermesProcessRunnerInternals = {
  runOnce: runHermesAgentProcessOnceImpl,
};

/**
 * Single spawn of Nous Hermes `run_agent.py` (no retries).
 */
function runHermesAgentProcessOnceImpl(
  options: RunHermesAgentProcessOptions,
): Promise<RunHermesAgentProcessResult> {
  const agentRoot = options.agentRoot.trim();
  const scriptPath = join(agentRoot, "run_agent.py");
  const skillCategory = options.skillCategory ?? "general";
  const initialStatus = resolveInitialStatusMessage(options);

  if (!existsSync(scriptPath)) {
    return Promise.resolve({
      success: false,
      finalResponse: "",
      stdout: "",
      stderr: "",
      exitCode: null,
      errorCode: "HERMES_AGENT_SCRIPT_MISSING",
      errorMessage: `run_agent.py not found under ${agentRoot}`,
      skillCategory,
    });
  }

  const query = options.query.trim().slice(0, MAX_QUERY_CHARS);
  if (!query) {
    return Promise.resolve({
      success: false,
      finalResponse: "",
      stdout: "",
      stderr: "",
      exitCode: null,
      errorCode: "HERMES_QUERY_EMPTY",
      errorMessage: "Hermes agent query is empty",
      skillCategory,
    });
  }

  const { executable, prefixArgs } = parsePythonCommand(
    options.env ?? process.env,
    options.pythonExecutable,
    options.pythonVersionFlag,
  );

  const toolsets = options.enabledToolsets ?? "safe,research";
  const args = [
    ...prefixArgs,
    "run_agent.py",
    "-",
    "--query",
    query,
    "--enabled_toolsets",
    toolsets,
    "--max_turns",
    "6",
  ];

  console.info(
    "[hermes-python] skills spawn:",
    [executable, ...args.slice(0, prefixArgs.length + 4)].join(" "),
    `toolsets=${toolsets}`,
    "cwd=",
    agentRoot,
  );
  console.info(`[hermes-python] status: ${initialStatus}`);

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      cwd: agentRoot,
      env: { ...process.env, ...options.env },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: RunHermesAgentProcessResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({
        ...result,
        skillCategory,
        userStatusMessage: result.userStatusMessage ?? initialStatus,
      });
    };

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish({
        success: false,
        finalResponse: "",
        stdout,
        stderr,
        exitCode: null,
        errorCode: "HERMES_AGENT_TIMEOUT",
        errorMessage: `Hermes agent exceeded ${timeoutMs}ms`,
        userStatusMessage: initialStatus,
        skillCategory,
      });
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      console.error("[hermes-python] spawn error:", error.message);
      finish({
        success: false,
        finalResponse: "",
        stdout,
        stderr,
        exitCode: null,
        errorCode: "HERMES_AGENT_SPAWN_FAILED",
        errorMessage: error.message,
        userStatusMessage: initialStatus,
        skillCategory,
      });
    });

    child.on("close", (exitCode) => {
      if (stdout.includes("Failed to initialize agent")) {
        const initLine =
          stdout
            .split("\n")
            .find((line) => line.includes("Failed to initialize agent")) ?? "";
        finish({
          success: false,
          finalResponse: "",
          stdout,
          stderr,
          exitCode,
          errorCode: "HERMES_AGENT_INIT_FAILED",
          errorMessage: initLine.trim() || "Hermes agent failed to initialize",
          userStatusMessage: initialStatus,
          skillCategory,
        });
        return;
      }

      const finalResponse = parseHermesAgentStdout(stdout);
      if (finalResponse) {
        finish({
          success: true,
          finalResponse,
          stdout,
          stderr,
          exitCode,
          userStatusMessage: initialStatus,
          skillCategory,
        });
        return;
      }

      const errorMessage =
        exitCode === 0
          ? "Hermes agent finished without FINAL RESPONSE section"
          : `Hermes agent exited with code ${exitCode ?? "unknown"}`;
      if (stderr.trim()) {
        console.error("[hermes-python] stderr:", stderr.slice(0, 2000));
      }
      console.error("[hermes-python] failed:", errorMessage);
      finish({
        success: false,
        finalResponse: "",
        stdout,
        stderr,
        exitCode,
        errorCode: "HERMES_FINAL_RESPONSE_MISSING",
        errorMessage,
        userStatusMessage: initialStatus,
        skillCategory,
      });
    });
  });
}

export function runHermesAgentProcessOnce(
  options: RunHermesAgentProcessOptions,
): Promise<RunHermesAgentProcessResult> {
  return hermesProcessRunnerInternals.runOnce(options);
}

/**
 * Run Nous Hermes `run_agent.py` with retries on unknown exit or rate limit.
 */
export async function runHermesAgentProcess(
  options: RunHermesAgentProcessOptions,
): Promise<RunHermesAgentProcessResult> {
  let lastResult: RunHermesAgentProcessResult | undefined;
  let retryAttempts = 0;
  let userStatusMessage = resolveInitialStatusMessage(options);
  const skillCategory = options.skillCategory ?? "general";
  const maxRetries = options.maxRetries ?? MAX_AGENT_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) {
      const rateLimited =
        lastResult &&
        isHermesAgentRateLimitError(lastResult.stderr, lastResult.stdout);
      userStatusMessage = rateLimited
        ? HERMES_RATE_LIMIT_USER_MESSAGE
        : HERMES_RESTART_USER_MESSAGE;
      console.info(
        `[hermes-python] retry attempt ${attempt}/${maxRetries}`,
      );
    }

    lastResult = await hermesProcessRunnerInternals.runOnce(options);
    if (lastResult.success) {
      return {
        ...lastResult,
        userStatusMessage,
        retryAttempts,
        skillCategory,
      };
    }

    if (
      !shouldRetryHermesAgentProcess(lastResult) ||
      attempt >= maxRetries
    ) {
      break;
    }

    retryAttempts += 1;
    const waitMs = resolveHermesAgentRetryDelayMs(
      lastResult.stderr,
      lastResult.stdout,
    );
    userStatusMessage = isHermesAgentRateLimitError(
      lastResult.stderr,
      lastResult.stdout,
    )
      ? HERMES_RATE_LIMIT_USER_MESSAGE
      : HERMES_RESTART_USER_MESSAGE;
    console.info(`[hermes-python] waiting ${waitMs}ms before retry`);
    await delay(waitMs);
  }

  const exhaustedRetries = retryAttempts >= maxRetries;
  return {
    ...lastResult!,
    userStatusMessage: exhaustedRetries
      ? HERMES_MAX_RETRIES_USER_MESSAGE
      : userStatusMessage,
    retryAttempts,
    skillCategory,
    errorMessage: exhaustedRetries
      ? HERMES_MAX_RETRIES_USER_MESSAGE
      : lastResult!.errorMessage,
  };
}

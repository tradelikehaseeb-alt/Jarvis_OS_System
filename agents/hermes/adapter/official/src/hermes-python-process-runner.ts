import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const FINAL_RESPONSE_MARKER = "FINAL RESPONSE:";
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_QUERY_CHARS = 8_000;

export interface RunHermesAgentProcessOptions {
  readonly agentRoot: string;
  readonly query: string;
  readonly pythonExecutable?: string;
  readonly pythonVersionFlag?: string;
  readonly enabledToolsets?: string;
  readonly timeoutMs?: number;
  readonly env?: NodeJS.ProcessEnv;
}

export interface RunHermesAgentProcessResult {
  readonly success: boolean;
  readonly finalResponse: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

export function resolveHermesAgentRoot(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const candidates = [
    env.HERMES_AGENT_PATH?.trim(),
    env.HERMES_PATH?.trim(),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const normalized = candidate.replace(/[\\/]+$/, "");
    const scriptPath = join(normalized, "run_agent.py");
    if (existsSync(scriptPath)) {
      return normalized;
    }
  }

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

  return body.slice(0, end).trim();
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

/**
 * Run Nous Hermes `run_agent.py` and return parsed final assistant text.
 */
export function runHermesAgentProcess(
  options: RunHermesAgentProcessOptions,
): Promise<RunHermesAgentProcessResult> {
  const agentRoot = options.agentRoot.trim();
  const scriptPath = join(agentRoot, "run_agent.py");
  if (!existsSync(scriptPath)) {
    return Promise.resolve({
      success: false,
      finalResponse: "",
      stdout: "",
      stderr: "",
      exitCode: null,
      errorCode: "HERMES_AGENT_SCRIPT_MISSING",
      errorMessage: `run_agent.py not found under ${agentRoot}`,
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
    });
  }

  const { executable, prefixArgs } = parsePythonCommand(
    options.env ?? process.env,
    options.pythonExecutable,
    options.pythonVersionFlag,
  );

  const args = [
    ...prefixArgs,
    "run_agent.py",
    "--query",
    query,
    "--enabled_toolsets",
    options.enabledToolsets ?? "safe",
    "--max_turns",
    "6",
  ];

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
      resolve(result);
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
      });
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      finish({
        success: false,
        finalResponse: "",
        stdout,
        stderr,
        exitCode: null,
        errorCode: "HERMES_AGENT_SPAWN_FAILED",
        errorMessage: error.message,
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
        });
        return;
      }

      const finalResponse = parseFinalResponseFromStdout(stdout);
      if (finalResponse) {
        finish({
          success: true,
          finalResponse,
          stdout,
          stderr,
          exitCode,
        });
        return;
      }

      finish({
        success: false,
        finalResponse: "",
        stdout,
        stderr,
        exitCode,
        errorCode: "HERMES_FINAL_RESPONSE_MISSING",
        errorMessage:
          exitCode === 0
            ? "Hermes agent finished without FINAL RESPONSE section"
            : `Hermes agent exited with code ${exitCode ?? "unknown"}`,
      });
    });
  });
}

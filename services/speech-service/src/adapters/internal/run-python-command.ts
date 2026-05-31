import { spawn } from "node:child_process";

export interface PythonCommandResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/**
 * Runs a Python one-liner or script via configured interpreter (Windows-friendly).
 */
export function runPythonCommand(
  pythonCommand: string,
  args: readonly string[],
  timeoutMs = 30_000,
): Promise<PythonCommandResult> {
  const parts = pythonCommand.trim().split(/\s+/);
  const executable = parts[0] ?? "python";
  const prefixArgs = parts.slice(1);

  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...prefixArgs, ...args], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Python command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 1,
      });
    });
  });
}

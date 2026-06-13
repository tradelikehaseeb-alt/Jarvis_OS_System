/** Structured execution trace for desktop / API ownership validation. */
export function isExecutionTraceEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.JARVIS_EXECUTION_TRACE === "true";
}

export function traceExecution(
  stage: string,
  detail: Readonly<Record<string, unknown>>,
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  if (!isExecutionTraceEnabled(env)) {
    return;
  }
  console.info("[jarvis-trace]", JSON.stringify({ stage, ...detail }));
}

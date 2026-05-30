import { useMemo } from "react";
import { isRealWorldValidationCommand, isRealWorldVoiceCommand } from "@jarvis/types";

export interface UseRealWorldExecutionOptions {
  readonly lastCommand?: string;
  readonly taskOutput?: Readonly<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly taskError?: string;
}

export interface UseRealWorldExecutionResult {
  readonly isRealWorldCommand: boolean;
  readonly showIndicator: boolean;
  readonly statusLabel: string;
  readonly providerOnline: boolean;
  readonly executionClear: boolean;
}

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * Derives real-world execution UX state from task output (Phase 100).
 */
export function useRealWorldExecution(
  options: UseRealWorldExecutionOptions = {},
): UseRealWorldExecutionResult {
  const isRealWorldCommand = useMemo(() => {
    const command = options.lastCommand?.trim() ?? "";
    return (
      isRealWorldValidationCommand(command) ||
      isRealWorldVoiceCommand(command) ||
      /\b(open|gmail|youtube|gold|workspace|summarize)\b/i.test(command)
    );
  }, [options.lastCommand]);

  const llmProvider = readRecord(options.taskOutput?.llmProvider);
  const stability = readRecord(options.taskOutput?.stability);
  const executionRuntime = readRecord(options.taskOutput?.executionRuntime);

  const providerOnline = llmProvider?.stub !== true;
  const executionClear = Boolean(
    executionRuntime?.browserState ||
      executionRuntime?.workflow ||
      options.taskOutput?.workforce ||
      options.taskOutput?.productivity,
  );

  const loading = options.loading ?? false;
  const failed = Boolean(options.taskError);

  let statusLabel = llmProvider?.stub === true ? "STUB MODE" : "REAL MODE";
  if (loading) {
    statusLabel = `${llmProvider?.stub === true ? "STUB MODE" : "REAL MODE"} · ${
      /\b(open|browse|gmail|youtube)\b/i.test(options.lastCommand ?? "")
        ? "Performing task…"
        : /\b(summarize|gold|market|news)\b/i.test(options.lastCommand ?? "")
          ? "Researching…"
          : "Working…"
    }`;
  } else if (failed) {
    statusLabel = "STUB MODE · Something went wrong";
  } else if (stability?.degraded) {
    statusLabel = "Recovering connection…";
  } else if (isRealWorldCommand) {
    statusLabel =
      llmProvider?.stub === true ? "STUB MODE · Completed (simulated)" : "REAL MODE · Completed";
  }

  return {
    isRealWorldCommand,
    showIndicator: isRealWorldCommand && (loading || executionClear || failed),
    statusLabel,
    providerOnline,
    executionClear,
  };
}

export interface InteractionValidationCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly message: string;
}

export interface InteractionValidationResult {
  readonly command: string;
  readonly success: boolean;
  readonly checks: readonly InteractionValidationCheck[];
  readonly latencyMs: number;
  readonly validatedAt: string;
}

export interface InteractionValidationInput {
  readonly command: string;
  readonly output?: Readonly<Record<string, unknown>>;
  readonly taskStatus?: string;
  readonly latencyMs: number;
  readonly voiceRoundtripMs?: number;
  readonly interrupted?: boolean;
  readonly providerFailover?: boolean;
}

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * Validates human interaction quality across voice, execution, memory, and recovery (Phase 96).
 */
export class InteractionValidationRuntime {
  validate(input: InteractionValidationInput): InteractionValidationResult {
    const output = input.output ?? {};
    const checks: InteractionValidationCheck[] = [];

    checks.push({
      id: "task_completed",
      label: "Task completed",
      passed: input.taskStatus === "completed",
      message:
        input.taskStatus === "completed"
          ? "Task reached completed state"
          : `Task status: ${input.taskStatus ?? "unknown"}`,
    });

    const activityStream = readRecord(output.activityStream);
    checks.push({
      id: "activity_stream",
      label: "Live activity stream",
      passed: Array.isArray(activityStream?.events) && activityStream.events.length > 0,
      message: "Activity events emitted during execution",
    });

    const timeline = readRecord(output.executionTimeline);
    checks.push({
      id: "execution_timeline",
      label: "Execution timeline",
      passed: Array.isArray(timeline?.events),
      message: "Timeline events available for UI streaming",
    });

    const executionRuntime = readRecord(output.executionRuntime);
    const isBrowserCommand = /\b(open|navigate|prepare|check)\b/i.test(input.command);
    checks.push({
      id: "browser_workflow",
      label: "Browser workflow",
      passed: !isBrowserCommand || Boolean(executionRuntime?.workflow ?? output.browserState),
      message: isBrowserCommand
        ? "Browser workflow metadata present"
        : "Not required for this command",
    });

    const memory = readRecord(output.memory);
    const expectsMemory = /remember/i.test(input.command);
    checks.push({
      id: "memory_continuity",
      label: "Memory continuity",
      passed: !expectsMemory || Boolean(memory?.conversationId ?? memory?.summary),
      message: expectsMemory
        ? "Memory block persisted for recall"
        : "Memory check skipped",
    });

    checks.push({
      id: "latency_budget",
      label: "Latency budget",
      passed: input.latencyMs < 30_000,
      message: `Observed ${input.latencyMs}ms (budget 30s)`,
    });

    if (typeof input.voiceRoundtripMs === "number") {
      checks.push({
        id: "voice_roundtrip",
        label: "Voice roundtrip",
        passed: input.voiceRoundtripMs < 15_000,
        message: `Voice roundtrip ${input.voiceRoundtripMs}ms`,
      });
    }

    if (input.interrupted) {
      checks.push({
        id: "interruption_recovery",
        label: "Interruption recovery",
        passed: input.taskStatus === "completed" || input.taskStatus === "failed",
        message: "Session recovered after interruption",
      });
    }

    if (input.providerFailover) {
      const stability = readRecord(output.stability);
      checks.push({
        id: "provider_failover",
        label: "Provider failover",
        passed: Boolean(stability?.mode),
        message: `Stability mode: ${String(stability?.mode ?? "unknown")}`,
      });
    }

    const success = checks.every((check) => check.passed);

    return {
      command: input.command,
      success,
      checks,
      latencyMs: input.latencyMs,
      validatedAt: new Date().toISOString(),
    };
  }
}

export function createDefaultInteractionValidationRuntime(): InteractionValidationRuntime {
  return new InteractionValidationRuntime();
}

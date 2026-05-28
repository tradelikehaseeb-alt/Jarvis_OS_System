export interface VoiceInterruptionValidationInput {
  readonly interrupted: boolean;
  readonly voiceRoundtripMs?: number;
  readonly followUp?: boolean;
  readonly taskStatus?: string;
  readonly output?: Readonly<Record<string, unknown>>;
}

export interface VoiceInterruptionValidationResult {
  readonly passed: boolean;
  readonly latencyAcceptable: boolean;
  readonly followUpContinuity: boolean;
  readonly recoveryAfterInterrupt: boolean;
  readonly message: string;
}

const VOICE_LATENCY_BUDGET_MS = 15_000;

/**
 * Validates voice interruption, follow-up continuity, and latency (Phase 100).
 */
export class VoiceInterruptionValidator {
  validate(input: VoiceInterruptionValidationInput): VoiceInterruptionValidationResult {
    const latencyAcceptable =
      typeof input.voiceRoundtripMs !== "number" ||
      input.voiceRoundtripMs < VOICE_LATENCY_BUDGET_MS;

    const recoveryAfterInterrupt = input.interrupted
      ? input.taskStatus === "completed" || input.taskStatus === "failed"
      : true;

    const output = input.output ?? {};
    const hasContinuity =
      Boolean(output.conversationId) ||
      Boolean((output.memory as { conversationId?: string } | undefined)?.conversationId);

    const followUpContinuity = input.followUp ? hasContinuity : true;

    const passed = latencyAcceptable && recoveryAfterInterrupt && followUpContinuity;

    return {
      passed,
      latencyAcceptable,
      followUpContinuity,
      recoveryAfterInterrupt,
      message: passed
        ? "Voice interaction within quality budget"
        : "Voice interaction quality check failed",
    };
  }
}

export function createDefaultVoiceInterruptionValidator(): VoiceInterruptionValidator {
  return new VoiceInterruptionValidator();
}

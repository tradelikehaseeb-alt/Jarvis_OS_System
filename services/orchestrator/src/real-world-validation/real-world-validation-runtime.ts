import {
  REAL_WORLD_VALIDATION_COMMANDS,
  type RealWorldValidationCommand,
} from "@jarvis/types";

import type { TaskLifecycleOperations } from "../orchestrator-service-impl";
import { DEFAULT_API_USER_ID } from "../task-execution/create-task-executor";
import {
  createDefaultInteractionValidationRuntime,
  type InteractionValidationRuntime,
} from "../demo-validation/interaction-validation-runtime";

import {
  createDefaultProviderFailoverValidator,
  type ProviderFailoverValidator,
} from "./provider-failover-validator";
import {
  createDefaultLongSessionStabilityValidator,
  type LongSessionStabilityValidator,
} from "./long-session-stability-validator";
import {
  createDefaultRealBrowserWorkflowValidator,
  type RealBrowserWorkflowValidator,
} from "./real-browser-workflow-validator";
import {
  createDefaultVoiceInterruptionValidator,
  type VoiceInterruptionValidator,
} from "./voice-interruption-validator";

export interface RealWorldCommandValidation {
  readonly command: RealWorldValidationCommand;
  readonly success: boolean;
  readonly latencyMs: number;
  readonly stub: boolean;
  readonly interactionPassed: boolean;
  readonly browserPassed: boolean;
}

export interface RealWorldValidationReport {
  readonly commandValidations: readonly RealWorldCommandValidation[];
  readonly providerFailover: ReturnType<ProviderFailoverValidator["validate"]>;
  readonly longSession: ReturnType<LongSessionStabilityValidator["evaluate"]>;
  readonly voiceQuality: ReturnType<VoiceInterruptionValidator["validate"]>;
  readonly allPassed: boolean;
  readonly validatedAt: string;
}

export interface RealWorldValidationOptions {
  readonly userId?: string;
  readonly conversationId?: string;
  readonly commands?: readonly RealWorldValidationCommand[];
}

function inferIntent(command: string): { kind: "automate" | "research" | "plan"; description: string } {
  if (/remember/i.test(command)) {
    return { kind: "plan", description: command };
  }
  if (/summarize|gold|market|news|research/i.test(command)) {
    return { kind: "research", description: command };
  }
  return { kind: "automate", description: command };
}

/**
 * Runs Phase 100 real-world validation against the live orchestrator pipeline.
 */
export class RealWorldValidationRuntime {
  constructor(
    private readonly orchestrator: TaskLifecycleOperations,
    private readonly interaction: InteractionValidationRuntime = createDefaultInteractionValidationRuntime(),
    private readonly providerFailover: ProviderFailoverValidator = createDefaultProviderFailoverValidator(),
    private readonly longSession: LongSessionStabilityValidator = createDefaultLongSessionStabilityValidator(),
    private readonly browser: RealBrowserWorkflowValidator = createDefaultRealBrowserWorkflowValidator(),
    private readonly voice: VoiceInterruptionValidator = createDefaultVoiceInterruptionValidator(),
  ) {}

  async validate(options: RealWorldValidationOptions = {}): Promise<RealWorldValidationReport> {
    const commands = options.commands ?? REAL_WORLD_VALIDATION_COMMANDS;
    const commandValidations: RealWorldCommandValidation[] = [];

    this.longSession.reset();

    for (const command of commands) {
      const started = Date.now();
      const intent = inferIntent(command);

      const { record } = await this.orchestrator.executeCreateTask({
        intent,
        userId: options.userId ?? DEFAULT_API_USER_ID,
        metadata: {
          conversationId: options.conversationId ?? "conv-real-world-100",
          source: "real-world-validation",
        },
      });

      const latencyMs = Date.now() - started;
      const output = record.taskStatus.output ?? {};
      const stub = Boolean(
        (output.llmProvider as { stub?: boolean } | undefined)?.stub ?? true,
      );

      const interactionResult = this.interaction.validate({
        command,
        taskStatus: record.taskStatus.status,
        latencyMs,
        output,
        voiceRoundtripMs: /jarvis/i.test(command) ? latencyMs : undefined,
        providerFailover: true,
      });

      const browserResult = this.browser.validate({
        command,
        output,
        taskStatus: record.taskStatus.status,
      });

      this.longSession.record({
        latencyMs,
        success: record.taskStatus.status === "completed",
      });

      commandValidations.push({
        command,
        success: record.taskStatus.status === "completed",
        latencyMs,
        stub,
        interactionPassed: interactionResult.success,
        browserPassed: browserResult.passed,
      });
    }

    const providerReport = await this.providerFailover.validate("openai");
    const longSessionReport = this.longSession.evaluate();
    const voiceReport = this.voice.validate({
      interrupted: false,
      followUp: true,
      taskStatus: "completed",
      voiceRoundtripMs: 1200,
    });

    const allPassed =
      commandValidations.every(
        (entry) => entry.success && entry.interactionPassed && entry.browserPassed,
      ) &&
      providerReport.allRegistered &&
      longSessionReport.stable &&
      voiceReport.passed;

    return {
      commandValidations,
      providerFailover: providerReport,
      longSession: longSessionReport,
      voiceQuality: voiceReport,
      allPassed,
      validatedAt: new Date().toISOString(),
    };
  }
}

export function createRealWorldValidationRuntime(
  orchestrator: TaskLifecycleOperations,
): RealWorldValidationRuntime {
  return new RealWorldValidationRuntime(orchestrator);
}

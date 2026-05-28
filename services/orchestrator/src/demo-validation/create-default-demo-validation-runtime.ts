import { DEMO_SCENARIO_COMMANDS } from "@jarvis/types";

import type { TaskLifecycleOperations } from "../orchestrator-service-impl";
import { createTestLiveExecutionRuntime } from "../live-execution/create-default-live-execution-runtime";
import { DEFAULT_API_USER_ID } from "../task-execution/create-task-executor";

import {
  createDemoScenarioRuntime,
  type DemoScenarioExecutor,
  type DemoScenarioReport,
  type DemoScenarioRuntime,
} from "./demo-scenario-runtime";
import {
  createDefaultInteractionValidationRuntime,
  type InteractionValidationResult,
  type InteractionValidationRuntime,
} from "./interaction-validation-runtime";
import {
  createDefaultHumanInteractionMetrics,
  scorePerceivedQuality,
  type HumanInteractionMetrics,
} from "./human-interaction-metrics";
import {
  createDefaultRealExecutionTelemetry,
  type RealExecutionTelemetry,
} from "./real-execution-telemetry";

export { DEMO_SCENARIO_COMMANDS };

export interface DemoValidationBundle {
  readonly demoScenarioRuntime: DemoScenarioRuntime;
  readonly interactionValidation: InteractionValidationRuntime;
  readonly telemetry: RealExecutionTelemetry;
  readonly metrics: HumanInteractionMetrics;
}

export interface RunDemoValidationOptions {
  readonly userId?: string;
  readonly conversationId?: string;
}

export interface DemoValidationReport {
  readonly scenarioReport: DemoScenarioReport;
  readonly interactionResults: readonly InteractionValidationResult[];
  readonly metrics: ReturnType<HumanInteractionMetrics["snapshot"]>;
  readonly telemetry: ReturnType<RealExecutionTelemetry["snapshot"]>;
}

function createOrchestratorDemoExecutor(
  orchestrator: TaskLifecycleOperations,
  options: RunDemoValidationOptions = {},
): DemoScenarioExecutor {
  return {
    async execute(command) {
      const started = Date.now();
      const intent =
        /remember/i.test(command)
          ? { kind: "plan" as const, description: command }
          : /search|gold|market|updates/i.test(command)
            ? { kind: "research" as const, description: command }
            : { kind: "automate" as const, description: command };

      const { record } = await orchestrator.executeCreateTask({
        intent,
        userId: options.userId ?? DEFAULT_API_USER_ID,
        metadata: {
          conversationId: options.conversationId ?? "conv-demo-96",
          source: "demo-validation",
        },
      });

      return {
        success: record.taskStatus.status === "completed",
        stub: Boolean(
          (record.taskStatus.output?.llmProvider as { stub?: boolean } | undefined)
            ?.stub ?? true,
        ),
        latencyMs: Date.now() - started,
        output: record.taskStatus.output,
      };
    },
  };
}

export function createDemoValidationBundle(
  orchestrator: TaskLifecycleOperations,
  options?: RunDemoValidationOptions,
): DemoValidationBundle {
  const telemetry = createDefaultRealExecutionTelemetry();
  const metrics = createDefaultHumanInteractionMetrics();
  const interactionValidation = createDefaultInteractionValidationRuntime();
  const demoScenarioRuntime = createDemoScenarioRuntime(
    createOrchestratorDemoExecutor(orchestrator, options),
  );

  return {
    demoScenarioRuntime,
    interactionValidation,
    telemetry,
    metrics,
  };
}

export async function runDemoValidation(
  orchestrator: TaskLifecycleOperations,
  options?: RunDemoValidationOptions,
): Promise<DemoValidationReport> {
  const bundle = createDemoValidationBundle(orchestrator, options);
  bundle.telemetry.startSession(`demo-${Date.now()}`);

  const scenarioReport = await bundle.demoScenarioRuntime.runAllScenarios();
  const interactionResults: InteractionValidationResult[] = [];

  for (const scenario of scenarioReport.scenarios) {
    bundle.telemetry.startSpan(`scenario-${scenario.scenarioId}`, scenario.command);
    const validation = bundle.interactionValidation.validate({
      command: scenario.command,
      taskStatus: scenario.success ? "completed" : "failed",
      latencyMs: scenario.latencyMs,
      output: {},
    });
    interactionResults.push(validation);
    bundle.telemetry.endSpan(`scenario-${scenario.scenarioId}`);

    bundle.metrics.record({
      command: scenario.command,
      latencyMs: scenario.latencyMs,
      perceivedQuality: scorePerceivedQuality({
        success: scenario.success,
        latencyMs: scenario.latencyMs,
      }),
      success: scenario.success,
    });
  }

  return {
    scenarioReport,
    interactionResults,
    metrics: bundle.metrics.snapshot(),
    telemetry: bundle.telemetry.snapshot(),
  };
}

export async function createTestDemoValidationBundle(): Promise<DemoValidationBundle> {
  const live = await createTestLiveExecutionRuntime();
  const executor: DemoScenarioExecutor = {
    async execute(command) {
      const started = Date.now();
      const session = live.startLiveExecution({
        userId: DEFAULT_API_USER_ID,
        conversationId: "conv-demo-test",
      });
      const result = await live.executeLiveTask({
        sessionId: session.sessionId,
        command,
      });
      return {
        success: result.success,
        stub: result.stub,
        latencyMs: Date.now() - started,
        output: result.flowResult.record.taskStatus.output,
      };
    },
  };

  return {
    demoScenarioRuntime: createDemoScenarioRuntime(executor),
    interactionValidation: createDefaultInteractionValidationRuntime(),
    telemetry: createDefaultRealExecutionTelemetry(),
    metrics: createDefaultHumanInteractionMetrics(),
  };
}

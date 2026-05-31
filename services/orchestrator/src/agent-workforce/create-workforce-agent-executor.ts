import type {
  AgentContext,
  AgentRegistryContract,
  AgentResult,
  AgentTask,
} from "@jarvis/agents-shared";
import { HERMES_AGENT_ID, OPENCLAW_AGENT_ID } from "../execution/agent-ids";
import type { TaskIntent } from "@jarvis/types";

import type { DelegatedWorkItem } from "./task-delegation-engine";
import type { ParallelWorkerExecutor } from "./parallel-execution-coordinator";

function workerIntent(
  workerType: DelegatedWorkItem["workerType"],
  description: string,
): TaskIntent {
  switch (workerType) {
    case "browser":
      return { kind: "automate", description };
    case "research":
      return { kind: "research", description };
    case "coding":
      return { kind: "automate", description };
    case "market":
      return { kind: "research", description };
    case "scheduling":
      return { kind: "plan", description };
    case "document":
      return { kind: "draft", description };
    case "communication":
      return { kind: "draft", description };
    default:
      return { kind: "default", description };
  }
}

function workerAgentId(workerType: DelegatedWorkItem["workerType"]): string {
  return workerType === "browser" || workerType === "coding"
    ? OPENCLAW_AGENT_ID
    : HERMES_AGENT_ID;
}

export interface CreateWorkforceAgentExecutorInput {
  readonly registry: AgentRegistryContract;
  readonly userId: string;
  readonly parentTaskId: string;
  readonly requestId: string;
  readonly agentContext: AgentContext;
  readonly correlationId?: string;
}

/**
 * Runs workforce workers through real Hermes/OpenClaw agents (Phase 97 activation).
 */
export function createWorkforceAgentExecutor(
  input: CreateWorkforceAgentExecutorInput,
): ParallelWorkerExecutor {
  return {
    async execute(item) {
      const agentId = workerAgentId(item.workerType);
      const agent = await input.registry.resolve(agentId);
      if (!agent) {
        return {
          success: false,
          stub: true,
          message: `Agent ${agentId} not registered for workforce worker`,
        };
      }

      const task: AgentTask = {
        taskId: `${input.parentTaskId}-workforce-${item.delegationId}`,
        requestId: `${input.requestId}-workforce-${item.delegationId}`,
        userId: input.userId,
        intent: workerIntent(item.workerType, item.action),
        correlationId: input.correlationId,
        metadata: {
          workforce: true,
          workerType: item.workerType,
          parentTaskId: input.parentTaskId,
        },
      };

      let result: AgentResult;
      try {
        result = await agent.execute(task, input.agentContext);
      } catch (error) {
        return {
          success: false,
          stub: true,
          message:
            error instanceof Error ? error.message : "Workforce agent execution failed",
        };
      }

      const payload = result.payload as Readonly<Record<string, unknown>> | undefined;
      const stubFlag = payload?.stub === true;

      return {
        success: result.success,
        stub: stubFlag,
        message: result.success
          ? `${item.userLabel.replace("…", "")} complete`
          : result.error?.message ?? "Worker failed",
      };
    },
  };
}

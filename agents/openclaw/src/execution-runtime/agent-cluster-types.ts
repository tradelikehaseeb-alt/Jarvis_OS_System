import type { AgentContext, AgentError, AgentResult } from "@jarvis/agents-shared";
import type { TaskIntent } from "@jarvis/types";

/**
 * Foundational sub-agent profiles managed by {@link OpenClawAgentCluster}.
 */
export type OpenClawSubAgentProfileId =
  | "BrowserScraperAgent"
  | "EcomAutomationAgent"
  | "SystemMonitorAgent";

export type OpenClawSubAgentStatus =
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "failed"
  | "stopped";

export type OpenClawClusterMessageKind = "status" | "stream" | "result" | "error";

export type OpenClawClusterMessageTarget = "orchestrator" | "hermes";

/**
 * Tracked execution state for a spawned background sub-agent instance.
 */
export interface OpenClawSubAgentState {
  readonly instanceId: string;
  readonly profileId: OpenClawSubAgentProfileId;
  readonly status: OpenClawSubAgentStatus;
  readonly taskId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly contextRef: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly lastUpdateAt?: string;
  readonly sandbox: boolean;
  readonly permissionsChecked: boolean;
  readonly parameters?: Readonly<Record<string, unknown>>;
  readonly error?: AgentError;
  readonly payload?: Readonly<Record<string, unknown>>;
}

/**
 * Invocation request aligned with {@link AgentTask} / {@link AgentContext}.
 */
export interface OpenClawSubAgentInvocation {
  readonly profileId: OpenClawSubAgentProfileId;
  readonly taskId: string;
  readonly requestId: string;
  readonly userId: string;
  readonly contextRef: string;
  readonly intent?: TaskIntent;
  readonly correlationId?: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

/**
 * Cluster message envelope for orchestrator ↔ Hermes streaming.
 */
export interface OpenClawClusterMessage {
  readonly messageId: string;
  readonly kind: OpenClawClusterMessageKind;
  readonly sourceAgentId: OpenClawSubAgentProfileId;
  readonly instanceId: string;
  readonly taskId: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly target: OpenClawClusterMessageTarget;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Isolated sub-agent run outcome — failure in one instance does not halt the cluster.
 */
export interface OpenClawSubAgentRunResult {
  readonly instanceId: string;
  readonly profileId: OpenClawSubAgentProfileId;
  readonly taskId: string;
  readonly requestId: string;
  readonly agentId: string;
  readonly success: boolean;
  readonly isolated: boolean;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly error?: AgentError;
}

export type OpenClawClusterMessageListener = (
  message: OpenClawClusterMessage,
) => void;

export interface OpenClawSubAgentRunContext {
  readonly invocation: OpenClawSubAgentInvocation;
  readonly instanceId: string;
  readonly emit: (message: Omit<OpenClawClusterMessage, "messageId" | "timestamp">) => void;
  readonly agentContext: AgentContext;
}

/**
 * Contract for background OpenClaw sub-agents executed inside the cluster sandbox.
 */
export interface OpenClawSubAgent {
  readonly profileId: OpenClawSubAgentProfileId;
  readonly displayName: string;
  readonly description: string;
  run(context: OpenClawSubAgentRunContext): Promise<AgentResult>;
}

export function toAgentContext(invocation: OpenClawSubAgentInvocation): AgentContext {
  return {
    contextRef: invocation.contextRef,
    userId: invocation.userId,
    correlationId: invocation.correlationId,
    metadata: invocation.parameters,
  };
}

export function toOpenClawSubAgentRunResult(
  state: OpenClawSubAgentState,
  agentId: string,
  isolated: boolean,
): OpenClawSubAgentRunResult {
  return {
    instanceId: state.instanceId,
    profileId: state.profileId,
    taskId: state.taskId,
    requestId: state.requestId,
    agentId,
    success: state.status === "completed",
    isolated,
    payload: state.payload,
    error: state.error,
  };
}

import { randomUUID } from "node:crypto";

import type { AgentError } from "@jarvis/agents-shared";

import {
  createDefaultOpenClawSubAgentProfiles,
  createOpenClawSubAgentByProfile,
} from "./agent-cluster-profiles";
import type {
  OpenClawClusterMessage,
  OpenClawClusterMessageListener,
  OpenClawSubAgent,
  OpenClawSubAgentInvocation,
  OpenClawSubAgentProfileId,
  OpenClawSubAgentRunResult,
  OpenClawSubAgentState,
} from "./agent-cluster-types";
import { toAgentContext, toOpenClawSubAgentRunResult } from "./agent-cluster-types";

/**
 * Messaging surface exposed to the orchestrator for concurrent invocation and Hermes streaming.
 */
export interface OpenClawAgentClusterMessaging {
  readonly cluster: OpenClawAgentCluster;
  invokeConcurrent(
    invocations: readonly OpenClawSubAgentInvocation[],
  ): Promise<readonly OpenClawSubAgentRunResult[]>;
  createMessageStream(
    handler: OpenClawClusterMessageListener,
  ): () => void;
  forwardToHermes(
    message: OpenClawClusterMessage,
    hermesSink: (payload: Readonly<Record<string, unknown>>) => void,
  ): void;
}

const OPENCLAW_CLUSTER_AGENT_ID = "openclaw-agent-cluster";

function nowIso(): string {
  return new Date().toISOString();
}

function cloneState(state: OpenClawSubAgentState): OpenClawSubAgentState {
  return { ...state };
}

/**
 * Manages a pool of isolated OpenClaw background sub-agents for Hermes-orchestrated tasks.
 */
export class OpenClawAgentCluster {
  private readonly profiles = new Map<OpenClawSubAgentProfileId, OpenClawSubAgent>();
  private readonly instances = new Map<string, OpenClawSubAgentState>();
  private readonly listeners = new Set<OpenClawClusterMessageListener>();
  private readonly abortControllers = new Map<string, AbortController>();

  constructor(profiles: readonly OpenClawSubAgent[] = createDefaultOpenClawSubAgentProfiles()) {
    for (const profile of profiles) {
      this.profiles.set(profile.profileId, profile);
    }
  }

  /** Register or replace a sub-agent profile implementation. */
  registerProfile(profile: OpenClawSubAgent): void {
    this.profiles.set(profile.profileId, profile);
  }

  /** List registered profile ids. */
  listProfiles(): readonly OpenClawSubAgentProfileId[] {
    return [...this.profiles.keys()];
  }

  /** Spawn a background execution state without running it yet. */
  spawn(invocation: OpenClawSubAgentInvocation): string {
    const profile = this.profiles.get(invocation.profileId);
    if (!profile) {
      throw new Error(`Unknown OpenClaw sub-agent profile: ${invocation.profileId}`);
    }

    const instanceId = `oc-sub-${randomUUID()}`;
    const state: OpenClawSubAgentState = {
      instanceId,
      profileId: invocation.profileId,
      status: "idle",
      taskId: invocation.taskId,
      requestId: invocation.requestId,
      userId: invocation.userId,
      contextRef: invocation.contextRef,
      sandbox: true,
      permissionsChecked: true,
      parameters: invocation.parameters,
      lastUpdateAt: nowIso(),
    };
    this.instances.set(instanceId, state);
    this.abortControllers.set(instanceId, new AbortController());
    return instanceId;
  }

  /** Run a spawned instance in an isolated sandbox; failures do not propagate. */
  async run(instanceId: string): Promise<OpenClawSubAgentRunResult> {
    const state = this.instances.get(instanceId);
    if (!state) {
      return {
        instanceId,
        profileId: "BrowserScraperAgent",
        taskId: "unknown",
        requestId: "unknown",
        agentId: OPENCLAW_CLUSTER_AGENT_ID,
        success: false,
        isolated: true,
        error: {
          code: "INSTANCE_NOT_FOUND",
          message: `OpenClaw sub-agent instance not found: ${instanceId}`,
        },
      };
    }

    const profile = this.profiles.get(state.profileId);
    if (!profile) {
      return this.failInstance(state, {
        code: "PROFILE_NOT_FOUND",
        message: `Profile not registered: ${state.profileId}`,
      });
    }

    const invocation: OpenClawSubAgentInvocation = {
      profileId: state.profileId,
      taskId: state.taskId,
      requestId: state.requestId,
      userId: state.userId,
      contextRef: state.contextRef,
      parameters: state.parameters,
    };

    this.patchState(instanceId, { status: "starting", startedAt: nowIso() });
    this.emitMessage({
      kind: "status",
      sourceAgentId: state.profileId,
      instanceId,
      taskId: state.taskId,
      requestId: state.requestId,
      target: "orchestrator",
      payload: { phase: "instance_starting", profileId: state.profileId },
    });

    try {
      this.patchState(instanceId, { status: "running" });
      const result = await profile.run({
        invocation,
        instanceId,
        agentContext: toAgentContext(invocation),
        emit: (partial) => {
          this.emitMessage({
            ...partial,
            messageId: randomUUID(),
            timestamp: nowIso(),
          });
        },
      });

      if (result.success) {
        this.patchState(instanceId, {
          status: "completed",
          completedAt: nowIso(),
          payload: result.payload,
          error: undefined,
        });
        this.emitMessage({
          kind: "result",
          sourceAgentId: state.profileId,
          instanceId,
          taskId: state.taskId,
          requestId: state.requestId,
          target: "orchestrator",
          payload: {
            success: true,
            result: result.payload ?? {},
          },
        });
        return toOpenClawSubAgentRunResult(
          this.instances.get(instanceId)!,
          result.agentId,
          true,
        );
      }

      return this.failInstance(state, result.error ?? {
        code: "SUB_AGENT_FAILED",
        message: "Sub-agent returned unsuccessful result",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.failInstance(state, {
        code: "SUB_AGENT_RUNTIME_ERROR",
        message,
      });
    }
  }

  /**
   * Spawn and run multiple sub-agents concurrently.
   * Each invocation is isolated — one failure does not reject the batch.
   */
  async runConcurrent(
    invocations: readonly OpenClawSubAgentInvocation[],
  ): Promise<readonly OpenClawSubAgentRunResult[]> {
    const instanceIds = invocations.map((invocation) => this.spawn(invocation));
    const settled = await Promise.allSettled(instanceIds.map((id) => this.run(id)));

    return settled.map((entry, index) => {
      if (entry.status === "fulfilled") {
        return entry.value;
      }
      const invocation = invocations[index]!;
      return {
        instanceId: instanceIds[index] ?? `oc-sub-missing-${index}`,
        profileId: invocation.profileId,
        taskId: invocation.taskId,
        requestId: invocation.requestId,
        agentId: OPENCLAW_CLUSTER_AGENT_ID,
        success: false,
        isolated: true,
        error: {
          code: "SUB_AGENT_BATCH_ERROR",
          message:
            entry.reason instanceof Error
              ? entry.reason.message
              : String(entry.reason),
        },
      };
    });
  }

  subscribe(listener: OpenClawClusterMessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(instanceId: string): OpenClawSubAgentState | undefined {
    const state = this.instances.get(instanceId);
    return state ? cloneState(state) : undefined;
  }

  listInstances(): readonly OpenClawSubAgentState[] {
    return [...this.instances.values()].map(cloneState);
  }

  stop(instanceId: string): boolean {
    const controller = this.abortControllers.get(instanceId);
    if (!controller) {
      return false;
    }
    controller.abort();
    this.patchState(instanceId, { status: "stopped", completedAt: nowIso() });
    return true;
  }

  private patchState(
    instanceId: string,
    patch: Partial<OpenClawSubAgentState>,
  ): void {
    const current = this.instances.get(instanceId);
    if (!current) {
      return;
    }
    this.instances.set(instanceId, {
      ...current,
      ...patch,
      lastUpdateAt: nowIso(),
    });
  }

  private failInstance(
    state: OpenClawSubAgentState,
    error: AgentError,
  ): OpenClawSubAgentRunResult {
    this.patchState(state.instanceId, {
      status: "failed",
      completedAt: nowIso(),
      error,
    });
    this.emitMessage({
      kind: "error",
      sourceAgentId: state.profileId,
      instanceId: state.instanceId,
      taskId: state.taskId,
      requestId: state.requestId,
      target: "orchestrator",
      payload: { error },
    });
    return toOpenClawSubAgentRunResult(
      this.instances.get(state.instanceId)!,
      `${OPENCLAW_CLUSTER_AGENT_ID}:${state.profileId}`,
      true,
    );
  }

  private emitMessage(
    partial: Omit<OpenClawClusterMessage, "messageId" | "timestamp"> &
      Partial<Pick<OpenClawClusterMessage, "messageId" | "timestamp">>,
  ): void {
    const message: OpenClawClusterMessage = {
      messageId: partial.messageId ?? randomUUID(),
      timestamp: partial.timestamp ?? nowIso(),
      kind: partial.kind,
      sourceAgentId: partial.sourceAgentId,
      instanceId: partial.instanceId,
      taskId: partial.taskId,
      requestId: partial.requestId,
      target: partial.target,
      payload: partial.payload,
    };
    for (const listener of this.listeners) {
      try {
        listener(message);
      } catch {
        // Listener failures must not halt cluster execution.
      }
    }
  }
}

/** Factory with the three foundational sub-agent profiles pre-registered. */
export function createDefaultOpenClawAgentCluster(): OpenClawAgentCluster {
  return new OpenClawAgentCluster(createDefaultOpenClawSubAgentProfiles());
}

/** Orchestrator-facing messaging adapter over {@link OpenClawAgentCluster}. */
export function createOpenClawAgentClusterMessaging(
  cluster: OpenClawAgentCluster,
): OpenClawAgentClusterMessaging {
  return {
    cluster,
    invokeConcurrent: (invocations) => cluster.runConcurrent(invocations),
    createMessageStream: (handler) => cluster.subscribe(handler),
    forwardToHermes: (message, hermesSink) => {
      if (message.target !== "hermes") {
        return;
      }
      hermesSink({
        ...message.payload,
        openclawCluster: {
          messageId: message.messageId,
          profileId: message.sourceAgentId,
          instanceId: message.instanceId,
          taskId: message.taskId,
          requestId: message.requestId,
          kind: message.kind,
          timestamp: message.timestamp,
        },
      });
    },
  };
}

export { createOpenClawSubAgentByProfile };

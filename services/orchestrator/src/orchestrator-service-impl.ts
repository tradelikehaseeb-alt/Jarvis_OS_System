import type { AgentRegistryContract } from "@jarvis/agents-shared";
import { registerDefaultAgents } from "@jarvis/agents-bootstrap";
import type {
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";

import { LiveAgentRegistry } from "./agent-registry/live-registry";
import { createStubComponents } from "./create-orchestrator-service";
import type { OrchestratorComponents, OrchestratorService } from "./orchestrator";
import {
  TaskStoreFactory,
  type TaskStore,
} from "./storage";
import {
  executeCreateTask,
  type CreateTaskExecutionInput,
  type CreateTaskExecutionResult,
} from "./task-execution/create-task-executor";

/**
 * Task lifecycle operations on top of {@link OrchestratorService} (Phase 14).
 */
export interface TaskLifecycleOperations {
  executeCreateTask(
    input: CreateTaskExecutionInput,
  ): Promise<CreateTaskExecutionResult>;

  getTaskStatus(taskId: string): Promise<TaskStatusResponse | null>;
}

/**
 * Orchestrator with full POST /tasks execution path (Phase 14).
 * Persists tasks via {@link TaskStore} only (Phase 15).
 */
export class OrchestratorServiceImpl
  implements OrchestratorService, TaskLifecycleOperations
{
  readonly serviceId = "orchestrator" as const;

  constructor(
    readonly components: OrchestratorComponents,
    private readonly executableRegistry: AgentRegistryContract,
    private readonly taskStore: TaskStore,
  ) {}

  async executeCreateTask(
    input: CreateTaskExecutionInput,
  ): Promise<CreateTaskExecutionResult> {
    return executeCreateTask(
      this.components,
      this.executableRegistry,
      input,
      this.taskStore,
    );
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse | null> {
    const record = this.taskStore.get(taskId);
    return record?.taskStatus ?? null;
  }

  /** Convenience — create response only. */
  async createTaskResponse(
    input: CreateTaskExecutionInput,
  ): Promise<CreateTaskResponse> {
    const { record } = await this.executeCreateTask(input);
    return record.createTaskResponse;
  }
}

/**
 * Wires stub orchestrator components + live agents + skill pipeline (Phase 14).
 * Uses shared file-backed {@link TaskStore} for CLI bridge (Phase 15).
 */
export async function createDefaultOrchestratorService(
  taskStore: TaskStore = TaskStoreFactory.getSharedDefault(),
): Promise<OrchestratorServiceImpl> {
  const { registry: executableRegistry } = await registerDefaultAgents();
  const liveRegistry = new LiveAgentRegistry(executableRegistry);
  const components: OrchestratorComponents = {
    ...createStubComponents(),
    agentRegistry: liveRegistry,
  };
  return new OrchestratorServiceImpl(
    components,
    executableRegistry,
    taskStore,
  );
}

/** In-memory service for unit tests (no file store). */
export async function createTestOrchestratorService(): Promise<OrchestratorServiceImpl> {
  return createDefaultOrchestratorService(TaskStoreFactory.createInMemory());
}

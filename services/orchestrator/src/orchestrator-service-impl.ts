import type { AgentRegistryContract } from "@jarvis/agents-shared";
import { registerDefaultAgents } from "@jarvis/agents-bootstrap";
import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";
import type {
  CreateTaskResponse,
  TaskStatusResponse,
} from "@jarvis/types";

import { createServiceComponents } from "./create-orchestrator-service";
import type { OrchestratorComponents, OrchestratorService } from "./orchestrator";
import {
  createDefaultMemoryPersistenceManager,
  type MemoryPersistenceManager,
} from "./memory";
import { LocalMemoryBackedMemoryStore } from "./memory/local-memory-backed-memory-store";
import type { MemoryStore } from "./memory/memory-store";
import {
  TaskStoreFactory,
  type TaskStore,
} from "./storage";
import {
  executeCreateTask,
  type CreateTaskExecutionInput,
  type CreateTaskExecutionOptions,
  type CreateTaskExecutionResult,
} from "./task-execution/create-task-executor";

/**
 * Task lifecycle operations on top of {@link OrchestratorService} (Phase 14).
 */
export interface TaskLifecycleOperations {
  executeCreateTask(
    input: CreateTaskExecutionInput,
    options?: CreateTaskExecutionOptions,
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
    private readonly sharedLocalMemory?: LocalMemoryRuntime,
    private readonly sharedMemoryStore?: MemoryStore,
    private readonly sharedMemoryPersistence?: MemoryPersistenceManager,
  ) {}

  async executeCreateTask(
    input: CreateTaskExecutionInput,
    options?: CreateTaskExecutionOptions,
  ): Promise<CreateTaskExecutionResult> {
    return executeCreateTask(
      this.components,
      this.executableRegistry,
      input,
      this.taskStore,
      {
        ...options,
        localMemoryRuntime:
          options?.localMemoryRuntime ?? this.sharedLocalMemory,
        memoryPersistenceManager:
          options?.memoryPersistenceManager ?? this.sharedMemoryPersistence,
      },
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
 * Wires real orchestrator components + live agents + skill pipeline (Phase 14+).
 * Uses shared file-backed {@link TaskStore} for CLI bridge (Phase 15).
 */
export async function createDefaultOrchestratorService(
  taskStore: TaskStore = TaskStoreFactory.getSharedDefault(),
): Promise<OrchestratorServiceImpl> {
  const { registry: executableRegistry } = await registerDefaultAgents();
  const sharedLocalMemory = createDefaultLocalMemoryRuntime();
  const sharedMemoryStore = new LocalMemoryBackedMemoryStore(sharedLocalMemory);
  const sharedMemoryPersistence = createDefaultMemoryPersistenceManager(
    sharedMemoryStore,
  );
  const components = createServiceComponents(executableRegistry, {
    localMemory: sharedLocalMemory,
    memoryStore: sharedMemoryStore,
  });
  return new OrchestratorServiceImpl(
    components,
    executableRegistry,
    taskStore,
    sharedLocalMemory,
    sharedMemoryStore,
    sharedMemoryPersistence,
  );
}

/** In-memory service for unit tests (no file store). */
export async function createTestOrchestratorService(): Promise<OrchestratorServiceImpl> {
  const { applyOrchestratorTestHarnessEnv } = await import("./test-harness-env");
  applyOrchestratorTestHarnessEnv();
  return createDefaultOrchestratorService(TaskStoreFactory.createInMemory());
}

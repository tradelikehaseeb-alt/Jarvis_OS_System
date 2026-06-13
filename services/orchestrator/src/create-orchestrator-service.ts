import type { AgentRegistryContract } from "@jarvis/agents-shared";
import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";
import { LocalMemoryBackedMemoryStore } from "./memory/local-memory-backed-memory-store";
import type { MemoryStore } from "./memory/memory-store";

import { AgentRegistryStub, ConfiguredAgentRegistry } from "./agent-registry/stub";
import { LiveAgentRegistry } from "./agent-registry/live-registry";
import type { AgentRegistry } from "./agent-registry/contract";
import {
  CapabilityRouterStub,
  DefaultCapabilityRouter,
} from "./capability-routing";
import type { CapabilityRouter } from "./capability-routing";
import { ContextManagerStub, DefaultContextManager } from "./context-manager/stub";
import {
  DefaultExecutionManager,
  ExecutionManagerStub,
} from "./execution-manager/stub";
import { useOrchestratorStubComponents } from "./internal/orchestrator-component-policy";
import type { OrchestratorComponents, OrchestratorService } from "./orchestrator";
import { DefaultTaskRouter, TaskRouterStub } from "./task-router/stub";
import {
  DefaultWorkflowManager,
  WorkflowManagerStub,
} from "./workflow-manager/stub";

export interface CreateOrchestratorComponentsOptions {
  readonly agentRegistry?: AgentRegistry;
  readonly agentExecutors?: AgentRegistryContract;
  readonly localMemory?: LocalMemoryRuntime;
  readonly memoryStore?: MemoryStore;
  readonly capabilityRouter?: CapabilityRouter;
}

/**
 * Production orchestrator components — real routing, context, workflow, execution.
 */
export function createOrchestratorComponents(
  options: CreateOrchestratorComponentsOptions = {},
): OrchestratorComponents {
  const localMemory =
    options.localMemory ??
    createDefaultLocalMemoryRuntime(
      process.env.NODE_ENV === "test" ? { useFileBackend: false } : undefined,
    );
  const memoryStore =
    options.memoryStore ?? new LocalMemoryBackedMemoryStore(localMemory);

  const agentRegistry =
    options.agentRegistry ?? new ConfiguredAgentRegistry();

  return {
    taskRouter: new DefaultTaskRouter(),
    workflowManager: new DefaultWorkflowManager(),
    contextManager: new DefaultContextManager({ localMemory, memoryStore }),
    executionManager: new DefaultExecutionManager({
      agents: options.agentExecutors,
      localMemory,
    }),
    agentRegistry,
    capabilityRouter: options.capabilityRouter ?? new DefaultCapabilityRouter(),
  };
}

/**
 * Legacy stub components — only when `NODE_ENV=test` and `ORCHESTRATOR_FORCE_STUB_COMPONENTS=true`.
 */
export function createLegacyStubComponents(): OrchestratorComponents {
  return {
    taskRouter: new TaskRouterStub(),
    executionManager: new ExecutionManagerStub(),
    contextManager: new ContextManagerStub(),
    workflowManager: new WorkflowManagerStub(),
    agentRegistry: new AgentRegistryStub(),
    capabilityRouter: new CapabilityRouterStub(),
  };
}

/**
 * @deprecated Use {@link createOrchestratorComponents}. Returns stubs only in forced test mode.
 */
export function createStubComponents(
  options: CreateOrchestratorComponentsOptions = {},
): OrchestratorComponents {
  if (useOrchestratorStubComponents()) {
    return createLegacyStubComponents();
  }
  return createOrchestratorComponents(options);
}

/**
 * Wires real orchestrator components (or legacy stubs in forced test mode).
 */
export function createOrchestratorService(
  options: CreateOrchestratorComponentsOptions = {},
): OrchestratorService {
  return {
    serviceId: "orchestrator",
    components: createStubComponents(options),
  };
}

/**
 * {@link OrchestratorService} with injected components (for tests and DI).
 */
export function createOrchestratorServiceWith(
  components: OrchestratorComponents,
): OrchestratorService {
  return {
    serviceId: "orchestrator",
    components,
  };
}

/**
 * Components for {@link OrchestratorServiceImpl} with live agent metadata when bootstrap is available.
 */
export function createServiceComponents(
  executableRegistry: AgentRegistryContract,
  options: CreateOrchestratorComponentsOptions = {},
): OrchestratorComponents {
  const base = createOrchestratorComponents({
    ...options,
    agentRegistry: new LiveAgentRegistry(executableRegistry),
    agentExecutors: executableRegistry,
  });
  return base;
}

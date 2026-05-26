import { AgentRegistryStub } from "./agent-registry/stub";
import { CapabilityRouterStub } from "./capability-routing";
import type { OrchestratorComponents, OrchestratorService } from "./orchestrator";
import { ContextManagerStub } from "./context-manager/stub";
import { ExecutionManagerStub } from "./execution-manager/stub";
import { TaskRouterStub } from "./task-router/stub";
import { WorkflowManagerStub } from "./workflow-manager/stub";

/**
 * Builds default stub implementations for all orchestrator components.
 * Phase 4 — internal wiring only; swap implementations in later phases.
 */
export function createStubComponents(): OrchestratorComponents {
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
 * Fully wired {@link OrchestratorService} using stub components.
 */
export function createOrchestratorService(): OrchestratorService {
  return {
    serviceId: "orchestrator",
    components: createStubComponents(),
  };
}

/**
 * {@link OrchestratorService} with injected components (for tests and future DI).
 */
export function createOrchestratorServiceWith(
  components: OrchestratorComponents,
): OrchestratorService {
  return {
    serviceId: "orchestrator",
    components,
  };
}

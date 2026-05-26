import type { AgentRegistry } from "./agent-registry";
import type { CapabilityRouter } from "./capability-routing";
import type { ContextManager } from "./context-manager";
import type { ExecutionManager } from "./execution-manager";
import type { TaskRouter } from "./task-router";
import type { WorkflowManager } from "./workflow-manager";

/**
 * Composed orchestrator components.
 */
export interface OrchestratorComponents {
  readonly taskRouter: TaskRouter;
  readonly executionManager: ExecutionManager;
  readonly contextManager: ContextManager;
  readonly workflowManager: WorkflowManager;
  readonly agentRegistry: AgentRegistry;
  /** Capability-based agent selection (Phase 12). */
  readonly capabilityRouter: CapabilityRouter;
}

/** Marker for the orchestrator service boundary. */
export interface OrchestratorService {
  readonly serviceId: "orchestrator";
  readonly components: OrchestratorComponents;
}

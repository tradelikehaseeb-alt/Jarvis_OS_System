/**
 * @jarvis/orchestrator — Jarvis Core orchestrator (Phase 4 stub wiring).
 * UI → api-gateway → orchestrator → agents → skills
 */

export type { OrchestratorComponents, OrchestratorService } from "./orchestrator";
export {
  createOrchestratorService,
  createOrchestratorServiceWith,
  createStubComponents,
} from "./create-orchestrator-service";
export {
  OrchestratorServiceImpl,
  createDefaultOrchestratorService,
  createTestOrchestratorService,
  type TaskLifecycleOperations,
} from "./orchestrator-service-impl";
export { OrchestratorServiceStub } from "./orchestrator-service-stub";
export { defaultOrchestratorService } from "./orchestrator-service";
export * from "./storage";
export * from "./task-execution";
export * from "./task-router";
export * from "./execution-manager";
export * from "./context-manager";
export * from "./workflow-manager";
export * from "./agent-registry";
export * from "./capability-routing";
export * from "./execution";
export * from "./memory";
export * from "./conversation-history";
export * from "./context";
export * from "./memory-recall";
export * from "./memory-intelligence";
export * from "./activity";
export * from "./voice-execution";
export * from "./voice-session";
export * from "./speech-realtime";
export * from "./runtime-startup";
export * from "./runtime-health";
export * from "./timeline";
export * from "./conversation-workspace";
export * from "./task-chain";
export * from "./adaptive-execution";
export * from "./execution-learning";
export * from "./user-feedback";
export * from "./llm-provider";
export * from "./streaming";
export * from "./storage-runtime";
export * from "./transport";
export * from "./e2e";
export * from "./live-execution";
export * from "./live-provider";
export * from "./user-session";

/** Orchestrator module identifiers for structure tests. */
export const ORCHESTRATOR_MODULE_IDS = [
  "task-router",
  "execution-manager",
  "context-manager",
  "workflow-manager",
  "agent-registry",
  "capability-router",
  "task-execution",
  "execution",
  "memory",
  "conversation-history",
  "context",
  "memory-recall",
  "memory-intelligence",
  "activity",
  "voice-execution",
  "voice-session",
  "speech-realtime",
  "runtime-startup",
  "runtime-health",
  "timeline",
  "conversation-workspace",
  "task-chain",
  "adaptive-execution",
  "execution-learning",
  "user-feedback",
  "llm-provider",
  "streaming",
  "storage-runtime",
  "transport",
  "e2e",
  "live-execution",
  "live-provider",
  "user-session",
  "storage",
] as const;

export type OrchestratorModuleId = (typeof ORCHESTRATOR_MODULE_IDS)[number];

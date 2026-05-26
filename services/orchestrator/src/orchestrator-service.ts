import type { OrchestratorService } from "./orchestrator";
import { createOrchestratorService } from "./create-orchestrator-service";

/**
 * Default orchestrator service instance (stub-backed).
 * Import factory directly when custom wiring is required.
 */
export const defaultOrchestratorService: OrchestratorService =
  createOrchestratorService();

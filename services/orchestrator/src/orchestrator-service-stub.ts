import { createStubComponents } from "./create-orchestrator-service";
import type { OrchestratorComponents, OrchestratorService } from "./orchestrator";

/**
 * Stub-backed {@link OrchestratorService} instance (Phase 4).
 * Holds wired components for api-gateway and tests.
 */
export class OrchestratorServiceStub implements OrchestratorService {
  readonly serviceId = "orchestrator" as const;
  readonly components: OrchestratorComponents;

  constructor(components: OrchestratorComponents = createStubComponents()) {
    this.components = components;
  }
}

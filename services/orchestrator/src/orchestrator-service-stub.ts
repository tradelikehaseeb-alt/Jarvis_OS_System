import {
  createOrchestratorComponents,
  createOrchestratorServiceWith,
  createLegacyStubComponents,
} from "./create-orchestrator-service";
import { useOrchestratorStubComponents } from "./internal/orchestrator-component-policy";
import type { OrchestratorComponents, OrchestratorService } from "./orchestrator";

/**
 * Orchestrator service with real workflow/context/execution components.
 * Legacy stubs only when `ORCHESTRATOR_FORCE_STUB_COMPONENTS=true` in test.
 */
export class OrchestratorServiceStub implements OrchestratorService {
  readonly serviceId = "orchestrator" as const;
  readonly components: OrchestratorComponents;

  constructor(components?: OrchestratorComponents) {
    if (components) {
      this.components = components;
      return;
    }

    this.components = useOrchestratorStubComponents()
      ? createLegacyStubComponents()
      : createOrchestratorComponents();
  }
}

/** Factory matching {@link createOrchestratorService} with optional component overrides. */
export function createOrchestratorServiceStub(
  components?: OrchestratorComponents,
): OrchestratorServiceStub {
  return new OrchestratorServiceStub(components);
}

/** @deprecated Prefer {@link createOrchestratorServiceStub} or {@link createOrchestratorComponents}. */
export function createStubOrchestratorService(): OrchestratorService {
  return createOrchestratorServiceWith(
    useOrchestratorStubComponents()
      ? createLegacyStubComponents()
      : createOrchestratorComponents(),
  );
}

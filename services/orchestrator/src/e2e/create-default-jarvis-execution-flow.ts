import { createTestOrchestratorService } from "../orchestrator-service-impl";
import { createDefaultExecutionLifecycleManager } from "../execution";
import { createDefaultMemoryPersistenceManager } from "../memory";
import { createDefaultStreamManager } from "../streaming";
import {
  DefaultJarvisExecutionFlow,
  type DefaultJarvisExecutionFlowDeps,
} from "./default-jarvis-execution-flow";
import type { JarvisExecutionFlow } from "./jarvis-execution-flow";

export interface CreateDefaultJarvisExecutionFlowOptions {
  readonly deps?: Partial<DefaultJarvisExecutionFlowDeps>;
}

/**
 * Factory for the default end-to-end Jarvis execution flow (Phase 50).
 * Wires speech normalization, desktop intent classifier, orchestrator, lifecycle, memory, and streaming.
 */
export async function createDefaultJarvisExecutionFlow(
  options: CreateDefaultJarvisExecutionFlowOptions = {},
): Promise<JarvisExecutionFlow> {
  const streamManager =
    options.deps?.streamManager ?? createDefaultStreamManager();
  const lifecycleManager =
    options.deps?.lifecycleManager ?? createDefaultExecutionLifecycleManager();
  const memoryPersistenceManager =
    options.deps?.memoryPersistenceManager ??
    createDefaultMemoryPersistenceManager(undefined, streamManager);
  const orchestrator =
    options.deps?.orchestrator ?? (await createTestOrchestratorService());

  return new DefaultJarvisExecutionFlow({
    orchestrator,
    streamManager,
    lifecycleManager,
    memoryPersistenceManager,
    ...options.deps,
  });
}

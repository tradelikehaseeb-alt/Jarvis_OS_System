import {
  createTestJarvisUserSessionRuntime,
  type JarvisUserSessionRuntime,
} from "@jarvis/orchestrator";

let runtimePromise: Promise<JarvisUserSessionRuntime> | undefined;

async function getRuntime(): Promise<JarvisUserSessionRuntime> {
  if (!runtimePromise) {
    runtimePromise = createTestJarvisUserSessionRuntime();
  }
  return runtimePromise;
}

/** @internal test hook */
export function __resetJarvisUserSessionRuntimeForTest(): void {
  runtimePromise = undefined;
}

export { getRuntime as getJarvisUserSessionRuntime };

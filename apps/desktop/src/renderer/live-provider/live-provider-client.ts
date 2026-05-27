import {
  createTestLiveProviderRuntime,
  type LiveProviderValidator,
} from "@jarvis/orchestrator";

let runtimePromise: Promise<LiveProviderValidator> | undefined;

async function getRuntime(): Promise<LiveProviderValidator> {
  if (!runtimePromise) {
    runtimePromise = createTestLiveProviderRuntime();
  }
  return runtimePromise;
}

/** @internal test hook */
export function __resetLiveProviderRuntimeForTest(): void {
  runtimePromise = undefined;
}

export { getRuntime as getLiveProviderRuntime };

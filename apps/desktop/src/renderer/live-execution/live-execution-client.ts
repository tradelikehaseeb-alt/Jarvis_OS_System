import {
  createTestLiveExecutionRuntime,
  type LiveExecutionRuntime,
} from "@jarvis/orchestrator";

let runtimePromise: Promise<LiveExecutionRuntime> | undefined;

async function getRuntime(): Promise<LiveExecutionRuntime> {
  if (!runtimePromise) {
    runtimePromise = createTestLiveExecutionRuntime();
  }
  return runtimePromise;
}

/** @internal test hook */
export function __resetLiveExecutionRuntimeForTest(): void {
  runtimePromise = undefined;
}

export { getRuntime as getLiveExecutionRuntime };

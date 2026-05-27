import type { RuntimeActionRequest } from "../../ipc/runtime-action";
import type { RuntimeActionResponse } from "../../ipc/runtime-action";

function getBridge() {
  if (!window.jarvis?.executeRuntimeAction) {
    throw new Error("Runtime action bridge unavailable");
  }
  return window.jarvis;
}

/**
 * Invokes a runtime control action via main-process IPC (Phase 57).
 */
export async function executeRuntimeAction(
  request: RuntimeActionRequest,
): Promise<RuntimeActionResponse> {
  return getBridge().executeRuntimeAction(request);
}

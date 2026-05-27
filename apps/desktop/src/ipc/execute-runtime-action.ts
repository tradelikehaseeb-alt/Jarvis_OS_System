import type { RuntimeProcess } from "@jarvis/runtime-process";

import {
  buildRuntimeHealthSnapshot,
  getRuntimeProcessManager,
} from "./api-runtime-lifecycle";
import type {
  RuntimeActionRequest,
  RuntimeActionResponse,
} from "./runtime-action";
import type { RuntimeHealthSnapshotProcess } from "./runtime-health-snapshot";

function serializeProcess(process: RuntimeProcess): RuntimeHealthSnapshotProcess {
  return {
    processId: process.processId,
    label: process.label,
    state: process.state,
    healthy: process.state === "running",
    restartCount: process.restartCount,
    lastError: process.lastError,
    startedAt: process.startedAt,
    stoppedAt: process.stoppedAt,
  };
}

function successResponse(
  request: RuntimeActionRequest,
  partial: Omit<RuntimeActionResponse, "ok" | "action">,
): RuntimeActionResponse {
  return {
    ok: true,
    action: request.action,
    ...partial,
  };
}

function failureResponse(
  request: RuntimeActionRequest,
  error: string,
): RuntimeActionResponse {
  return {
    ok: false,
    action: request.action,
    processId: request.processId,
    error,
  };
}

/**
 * Executes a runtime control action via the process manager (Phase 57).
 */
export async function executeRuntimeAction(
  request: RuntimeActionRequest,
): Promise<RuntimeActionResponse> {
  const manager = getRuntimeProcessManager();

  if (request.action === "refresh-health") {
    const health = buildRuntimeHealthSnapshot();
    return successResponse(request, {
      message: "Runtime health refreshed",
      health,
    });
  }

  const processId = request.processId;
  if (!processId) {
    return failureResponse(request, "processId is required for this action");
  }

  try {
    let process: RuntimeProcess;

    switch (request.action) {
      case "start":
        process = await manager.startProcess(processId);
        break;
      case "stop":
        process = await manager.stopProcess(processId);
        break;
      case "restart":
        process = await manager.restartProcess(processId);
        break;
      default:
        return failureResponse(request, `Unsupported action: ${request.action}`);
    }

    const serialized = serializeProcess(process);
    const health = buildRuntimeHealthSnapshot();

    return {
      ok: process.state !== "failed",
      action: request.action,
      processId,
      process: serialized,
      health,
      message:
        process.state === "failed"
          ? process.lastError ?? `${request.action} failed`
          : `${request.action} completed`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failureResponse(request, message);
  }
}

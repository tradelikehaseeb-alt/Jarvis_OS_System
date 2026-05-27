import type { CreateTaskRequest } from "@jarvis/types";

import type { JarvisApiResponse } from "./jarvis-api-response";

const ALLOWED_INTENT_KINDS = new Set([
  "automate",
  "plan",
  "research",
  "draft",
  "default",
]);

const MAX_INTENT_DESCRIPTION_LENGTH = 4096;

function validationError(
  message: string,
  details?: Readonly<Record<string, unknown>>,
): JarvisApiResponse {
  return {
    status: 422,
    error: {
      code: "VALIDATION_ERROR",
      message,
      details,
    },
  };
}

/**
 * Validate POST /tasks body — mirrors api-gateway validators (Phase 53).
 */
export function validateCreateTaskRequest(
  body: unknown,
): JarvisApiResponse | CreateTaskRequest {
  if (!body || typeof body !== "object") {
    return validationError("Request body must be a JSON object");
  }

  const record = body as Record<string, unknown>;
  const intent = record.intent;

  if (!intent || typeof intent !== "object") {
    return validationError("intent is required");
  }

  const intentRecord = intent as Record<string, unknown>;
  const kind =
    typeof intentRecord.kind === "string" ? intentRecord.kind.trim() : "";
  const description =
    typeof intentRecord.description === "string"
      ? intentRecord.description.trim()
      : "";

  if (!kind) {
    return validationError("intent.kind must not be empty");
  }
  if (!description) {
    return validationError("intent.description must not be empty");
  }
  if (!ALLOWED_INTENT_KINDS.has(kind)) {
    return validationError(
      `intent.kind must be one of: ${[...ALLOWED_INTENT_KINDS].sort().join(", ")}`,
      { kind, allowed: [...ALLOWED_INTENT_KINDS].sort() },
    );
  }
  if (description.length > MAX_INTENT_DESCRIPTION_LENGTH) {
    return validationError(
      `intent.description must be at most ${MAX_INTENT_DESCRIPTION_LENGTH} characters`,
    );
  }

  return {
    intent: {
      kind: kind as CreateTaskRequest["intent"]["kind"],
      description,
      parameters:
        intentRecord.parameters && typeof intentRecord.parameters === "object"
          ? (intentRecord.parameters as CreateTaskRequest["intent"]["parameters"])
          : undefined,
      priority:
        typeof intentRecord.priority === "string"
          ? (intentRecord.priority as CreateTaskRequest["intent"]["priority"])
          : undefined,
    },
    correlationId:
      typeof record.correlationId === "string" ? record.correlationId : undefined,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as CreateTaskRequest["metadata"])
        : undefined,
  };
}

import { describe, expect, it } from "vitest";

import { validateCreateTaskRequest } from "../validate-create-task-request";

describe("validateCreateTaskRequest", () => {
  it("accepts valid create task payloads", () => {
    const result = validateCreateTaskRequest({
      intent: {
        kind: "plan",
        description: "Plan my week",
      },
      correlationId: "corr-1",
    });

    expect("intent" in result).toBe(true);
    if ("intent" in result) {
      expect(result.intent.kind).toBe("plan");
      expect(result.correlationId).toBe("corr-1");
    }
  });

  it("rejects empty intent kind", () => {
    const result = validateCreateTaskRequest({
      intent: {
        kind: "",
        description: "x",
      },
    });

    expect("status" in result).toBe(true);
    if ("status" in result) {
      expect(result.status).toBe(422);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejects unsupported intent kind", () => {
    const result = validateCreateTaskRequest({
      intent: {
        kind: "invalid",
        description: "x",
      },
    });

    expect("status" in result && result.error?.code).toBe("VALIDATION_ERROR");
  });
});

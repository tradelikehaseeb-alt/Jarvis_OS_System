import type { UserTask } from "@jarvis/types";

import { MOCK_TIMESTAMP } from "../internal/mock-ids";

/** Sample task for stub unit tests. */
export function sampleUserTask(overrides?: Partial<UserTask>): UserTask {
  return {
    id: "task-test-001",
    userId: "user-test-001",
    intent: {
      kind: "automate",
      description: "Stub task for tests",
      priority: "normal",
    },
    createdAt: MOCK_TIMESTAMP,
    ...overrides,
  };
}

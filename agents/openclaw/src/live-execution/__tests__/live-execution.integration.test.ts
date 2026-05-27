import { describe, expect, it } from "vitest";

import {
  LIVE_EXECUTION_VALIDATION_COMMANDS,
  REAL_PROVIDER_VALIDATION_COMMANDS,
} from "@jarvis/types";

import { createOpenClawAdapterStub } from "../../../adapter/src/openclaw-adapter-stub";
import { DefaultOpenClawGateway } from "../../gateway/default-openclaw-gateway";

const ALL_VALIDATION_COMMANDS = [
  ...LIVE_EXECUTION_VALIDATION_COMMANDS,
  ...REAL_PROVIDER_VALIDATION_COMMANDS,
] as const;

describe("OpenClaw live execution integration", () => {
  it.each(ALL_VALIDATION_COMMANDS)(
    "executes live validation command via gateway stub: %s",
    async (command) => {
      const gateway = new DefaultOpenClawGateway({
        env: { OPENCLAW_MODE: "stub" },
        adapter: createOpenClawAdapterStub(),
      });

      const response = await gateway.execute({
        requestId: `req-${command.slice(0, 8)}`,
        taskId: `task-${command.slice(0, 8)}`,
        userId: "user-live-1",
        intent: { kind: "automate", description: command },
        contextRef: "ctx-live-1",
        requestedActions: ["browser"],
      });

      expect(response.success).toBe(true);
      expect(response.stub).toBe(true);
    },
  );
});

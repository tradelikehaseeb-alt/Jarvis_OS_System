import { describe, expect, it } from "vitest";
import { InMemoryAgentRegistry } from "@jarvis/agents-shared";

import { registerDefaultAgents } from "../index";

describe("registerDefaultAgents metadata validation", () => {
  it("registers hermes and openclaw with valid metadata", async () => {
    const { hermes, openClaw } = await registerDefaultAgents(
      new InMemoryAgentRegistry(),
    );

    expect(hermes.metadata.agentId).toBe("hermes");
    expect(openClaw.metadata.agentId).toBe("openclaw-gateway");
    expect(hermes.metadata.capabilities.length).toBeGreaterThan(0);
    expect(openClaw.metadata.capabilities.length).toBeGreaterThan(0);
  });
});

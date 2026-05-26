import { describe, expect, it } from "vitest";

import {
  BROWSER_SKILL_ID,
  FILE_SKILL_ID,
  SEARCH_SKILL_ID,
} from "@jarvis/agents-shared";
import { HERMES_AGENT_ID } from "@jarvis/hermes";
import { OPENCLAW_AGENT_ID } from "@jarvis/openclaw";

import { registerDefaultAgents } from "../index";

describe("registerDefaultAgents", () => {
  it("registers agents, bindings, provider resolver, and concrete skills", async () => {
    const { registry, pipeline, providerResolver, hermes, openClaw } =
      await registerDefaultAgents();
    expect(providerResolver.hermesProviderId).toBe("hermes-local");
    expect(providerResolver.openclawProviderId).toBe("openclaw-local");
    expect(hermes.metadata.agentId).toBe(HERMES_AGENT_ID);
    expect(openClaw.metadata.agentId).toBe(OPENCLAW_AGENT_ID);

    const agents = await registry.list();
    expect(agents).toHaveLength(2);

    const hermesBinding = await pipeline.bindings.resolve(HERMES_AGENT_ID);
    expect(hermesBinding?.skillIds).toContain(SEARCH_SKILL_ID);

    const skills = await pipeline.skillRegistry.list();
    expect(skills.map((s) => s.skillId).sort()).toEqual(
      [SEARCH_SKILL_ID, FILE_SKILL_ID, BROWSER_SKILL_ID].sort(),
    );
  });
});

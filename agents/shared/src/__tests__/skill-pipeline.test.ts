import { describe, expect, it } from "vitest";

import type { AgentContext } from "../agent-context";
import {
  BROWSER_SKILL_ID,
  FILE_SKILL_ID,
  SEARCH_SKILL_ID,
} from "../pipeline-ids";
import { createDefaultSkillPipeline } from "../create-skill-pipeline";
import { InMemorySkillBindingRegistry } from "../in-memory-skill-binding-registry";
import { DefaultSkillExecutor } from "../skill-executor";
import { InMemorySkillRegistry } from "@jarvis/skills-shared";
import { PipelineStubSkill } from "../pipeline-stub-skill";

const agentContext: AgentContext = {
  contextRef: "ctx-1",
  userId: "user-1",
};

describe("SkillExecutor pipeline", () => {
  it("executes bound skill via SkillRegistry only", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const response = await skillExecutor.execute(
      {
        executionId: "exec-1",
        agentId: "hermes",
        skillId: SEARCH_SKILL_ID,
        userId: "user-1",
        parameters: { step: "plan" },
        contextRef: "ctx-1",
      },
      agentContext,
    );
    expect(response.success).toBe(true);
    expect(response.data?.results).toBeDefined();
  });

  it("rejects unbound skill for agent", async () => {
    const { skillExecutor } = await createDefaultSkillPipeline();
    const response = await skillExecutor.execute(
      {
        executionId: "exec-2",
        agentId: "hermes",
        skillId: BROWSER_SKILL_ID,
        userId: "user-1",
        parameters: {},
        contextRef: "ctx-1",
      },
      agentContext,
    );
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("SKILL_NOT_BOUND");
  });

  it("rejects unregistered skill id", async () => {
    const registry = new InMemorySkillRegistry();
    const bindings = new InMemorySkillBindingRegistry();
    await bindings.register({ agentId: "hermes", skillIds: ["missing-skill"] });
    const executor = new DefaultSkillExecutor(registry, bindings);

    const response = await executor.execute(
      {
        executionId: "exec-3",
        agentId: "hermes",
        skillId: "missing-skill",
        userId: "user-1",
        parameters: {},
        contextRef: "ctx-1",
      },
      agentContext,
    );
    expect(response.error?.code).toBe("SKILL_NOT_FOUND");
  });

  it("registers bindings in binding registry", async () => {
    const { bindings } = await createDefaultSkillPipeline();
    const hermesBinding = await bindings.resolve("hermes");
    expect(hermesBinding?.skillIds).toContain(SEARCH_SKILL_ID);
    const openclawBinding = await bindings.resolve("openclaw-gateway");
    expect(openclawBinding?.skillIds).toContain(BROWSER_SKILL_ID);
    expect(openclawBinding?.skillIds).toContain(FILE_SKILL_ID);
  });
});

describe("PipelineStubSkill", () => {
  it("returns static pipeline data", async () => {
    const skill = new PipelineStubSkill({
      skillId: "test-stub",
      displayName: "Test",
      version: "0.0.0",
      capabilities: [],
      sideEffectCapable: false,
    });
    const output = await skill.execute(
      {
        invocationId: "inv-1",
        skillId: "test-stub",
        agentId: "hermes",
        userId: "user-1",
        parameters: {},
      },
      { contextRef: "ctx-1", userId: "user-1", agentId: "hermes" },
    );
    expect(output.data?.stub).toBe(true);
  });
});

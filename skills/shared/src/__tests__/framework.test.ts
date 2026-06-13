import { describe, expect, it } from "vitest";

import {
  AbstractBaseSkill,
  type BaseSkill,
  type SkillCapability,
  type SkillContext,
  type SkillInput,
  type SkillMetadata,
  type SkillOutput,
  type SkillRegistry,
} from "../index";

const sampleCapability: SkillCapability = {
  id: "cap-search",
  kind: "search",
  description: "Search capability",
};

const sampleMetadata: SkillMetadata = {
  skillId: "web-search",
  displayName: "Web Search",
  version: "0.0.0",
  capabilities: [sampleCapability],
  sideEffectCapable: false,
};

const sampleInput: SkillInput = {
  invocationId: "inv-1",
  skillId: "web-search",
  agentId: "hermes",
  userId: "user-1",
  parameters: { query: "flights to NYC" },
};

const sampleContext: SkillContext = {
  contextRef: "ctx-1",
  userId: "user-1",
  agentId: "hermes",
};

describe("skills framework contracts", () => {
  it("SkillInput carries agent and parameters", () => {
    expect(sampleInput.agentId).toBe("hermes");
    expect(sampleInput.parameters.query).toBe("flights to NYC");
  });

  it("BaseSkill is structurally implementable", async () => {
    const skill: BaseSkill = {
      metadata: sampleMetadata,
      execute: async () => ({
        invocationId: sampleInput.invocationId,
        skillId: sampleMetadata.skillId,
        success: true,
        data: { results: [] },
      }),
    };
    const output = await skill.execute(sampleInput, sampleContext);
    expect(output.success).toBe(true);
  });

  it("AbstractBaseSkill can be extended without business logic", async () => {
    class TestSkill extends AbstractBaseSkill {
      readonly metadata = sampleMetadata;

      execute(): Promise<SkillOutput> {
        return Promise.resolve({
          invocationId: sampleInput.invocationId,
          skillId: this.metadata.skillId,
          success: true,
          data: { stub: true },
        });
      }
    }

    const skill = new TestSkill();
    const output = await skill.execute(sampleInput, sampleContext);
    expect(output.data).toEqual({ stub: true });
  });

  it("SkillRegistry is assignable", async () => {
    const skills = new Map<string, BaseSkill>();

    const registry: SkillRegistry = {
      registryId: "skill-registry",
      register: async (skill) => {
        skills.set(skill.metadata.skillId, skill);
      },
      unregister: async (skillId) => skills.delete(skillId),
      resolve: async (skillId) => skills.get(skillId),
      list: async () => [...skills.values()].map((s) => s.metadata),
    };

    const stubSkill: BaseSkill = {
      metadata: sampleMetadata,
      execute: async () => ({
        invocationId: "inv-1",
        skillId: sampleMetadata.skillId,
        success: true,
      }),
    };

    await registry.register(stubSkill);
    expect((await registry.list())).toHaveLength(1);
    expect(await registry.resolve("web-search")).toBe(stubSkill);
  });

  it("SkillContext does not imply local memory storage", () => {
    const ctx: SkillContext = {
      contextRef: "ctx-1",
      userId: "user-1",
      agentId: "hermes",
      memoryApiRef: "memory-api-client",
    };
    expect(ctx.memoryApiRef).toBeDefined();
  });

  it("exports Hermes dynamic Windows automation capability metadata", async () => {
    const { HERMES_DYNAMIC_WINDOWS_AUTOMATION_CAPABILITY } = await import(
      "../hermes-dynamic-windows-automation"
    );
    expect(HERMES_DYNAMIC_WINDOWS_AUTOMATION_CAPABILITY.id).toBe(
      "hermes-dynamic-windows-script",
    );
    expect(HERMES_DYNAMIC_WINDOWS_AUTOMATION_CAPABILITY.kind).toBe("automate");
  });
});

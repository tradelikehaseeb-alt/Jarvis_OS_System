import type { SkillMetadata } from "@jarvis/skills-shared";

export const BROWSER_SKILL_ID = "browser-skill" as const;

export const BROWSER_SKILL_METADATA: SkillMetadata = {
  skillId: BROWSER_SKILL_ID,
  displayName: "Browser",
  version: "0.0.0-phase13",
  capabilities: [
    {
      id: "browser-navigate",
      kind: "automate",
      description: "Static browser navigation mock",
    },
  ],
  sideEffectCapable: true,
};

import type { SkillMetadata } from "@jarvis/skills-shared";

export const SEARCH_SKILL_ID = "search-skill" as const;

export const SEARCH_SKILL_METADATA: SkillMetadata = {
  skillId: SEARCH_SKILL_ID,
  displayName: "Search",
  version: "0.0.0-phase13",
  capabilities: [
    { id: "search-read", kind: "search", description: "Static search results" },
  ],
  sideEffectCapable: false,
};

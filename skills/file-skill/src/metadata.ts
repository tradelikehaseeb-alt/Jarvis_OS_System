import type { SkillMetadata } from "@jarvis/skills-shared";

export const FILE_SKILL_ID = "file-skill" as const;

export const FILE_SKILL_METADATA: SkillMetadata = {
  skillId: FILE_SKILL_ID,
  displayName: "File",
  version: "0.0.0-phase13",
  capabilities: [
    { id: "file-write", kind: "write", description: "Static file operations" },
    { id: "file-read", kind: "read", description: "Static file read mock" },
  ],
  sideEffectCapable: true,
};

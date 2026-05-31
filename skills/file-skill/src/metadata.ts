import type { SkillMetadata } from "@jarvis/skills-shared";

export const FILE_SKILL_ID = "file-skill" as const;

export const FILE_SKILL_METADATA: SkillMetadata = {
  skillId: FILE_SKILL_ID,
  displayName: "File",
  version: "0.0.0-phase13",
  capabilities: [
    { id: "file-write", kind: "write", description: "Write files in workspace" },
    { id: "file-read", kind: "read", description: "Read files in workspace" },
    { id: "file-list", kind: "read", description: "List workspace directories" },
    { id: "file-search", kind: "read", description: "Search workspace files" },
  ],
  sideEffectCapable: true,
};

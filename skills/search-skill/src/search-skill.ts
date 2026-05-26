import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import { SEARCH_SKILL_ID, SEARCH_SKILL_METADATA } from "./metadata";

/**
 * Search skill — static mock results only (Phase 13).
 * No internet, no search engine APIs.
 */
export class SearchSkill extends AbstractBaseSkill {
  readonly metadata = SEARCH_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    const query =
      typeof input.parameters.query === "string"
        ? input.parameters.query
        : "default-query";

    return {
      invocationId: input.invocationId,
      skillId: SEARCH_SKILL_ID,
      success: true,
      data: {
        stub: true,
        query,
        results: [
          { title: "Stub result A", url: "https://stub.local/a", score: 0.9 },
          { title: "Stub result B", url: "https://stub.local/b", score: 0.7 },
        ],
        total: 2,
      },
    };
  }
}

import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import { FILE_SKILL_ID, FILE_SKILL_METADATA } from "./metadata";

/**
 * File skill — static file operation results (Phase 13).
 * No filesystem or desktop control.
 */
export class FileSkill extends AbstractBaseSkill {
  readonly metadata = FILE_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    const operation =
      typeof input.parameters.operation === "string"
        ? input.parameters.operation
        : "read";
    const path =
      typeof input.parameters.path === "string"
        ? input.parameters.path
        : "/stub/path.txt";

    return {
      invocationId: input.invocationId,
      skillId: FILE_SKILL_ID,
      success: true,
      data: {
        stub: true,
        operation,
        path,
        result: {
          status: "ok",
          bytes: 128,
          message: `Mock ${operation} completed on ${path}`,
        },
      },
    };
  }
}

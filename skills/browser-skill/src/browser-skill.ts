import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import { BROWSER_SKILL_ID, BROWSER_SKILL_METADATA } from "./metadata";

/**
 * Browser skill — static browser action results (Phase 13).
 * No browser automation, Playwright, or OpenClaw runtime.
 */
export class BrowserSkill extends AbstractBaseSkill {
  readonly metadata = BROWSER_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    const action =
      typeof input.parameters.action === "string"
        ? input.parameters.action
        : "navigate";
    const url =
      typeof input.parameters.url === "string"
        ? input.parameters.url
        : "https://stub.local/";

    return {
      invocationId: input.invocationId,
      skillId: BROWSER_SKILL_ID,
      success: true,
      data: {
        stub: true,
        action,
        url,
        result: {
          status: "completed",
          title: "Stub Page Title",
          screenshotRef: null,
        },
      },
    };
  }
}

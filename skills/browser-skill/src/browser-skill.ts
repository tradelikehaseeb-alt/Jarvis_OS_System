import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import { BROWSER_SKILL_ID, BROWSER_SKILL_METADATA } from "./metadata";

function readRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * Browser skill — exposes the browser execution result produced by OpenClaw.
 */
export class BrowserSkill extends AbstractBaseSkill {
  readonly metadata = BROWSER_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    const runtimeResult = readRecord(input.parameters.browserRuntimeResult);
    const action =
      typeof runtimeResult?.action === "string"
        ? runtimeResult.action
        : typeof input.parameters.action === "string"
          ? input.parameters.action
          : "browser-action";
    const url =
      typeof runtimeResult?.url === "string"
        ? runtimeResult.url
        : typeof input.parameters.url === "string"
          ? input.parameters.url
          : undefined;

    if (!runtimeResult) {
      return {
        invocationId: input.invocationId,
        skillId: BROWSER_SKILL_ID,
        success: false,
        error: {
          code: "BROWSER_RUNTIME_RESULT_MISSING",
          message:
            "BrowserSkill requires BrowserExecutionRuntime output; no simulated browser result was generated.",
        },
      };
    }

    const browserState = readRecord(runtimeResult.browserState);
    const status =
      typeof runtimeResult.status === "string"
        ? runtimeResult.status
        : runtimeResult.success === true
          ? "completed"
          : "failed";
    const screenshotRef =
      typeof runtimeResult.screenshotRef === "string"
        ? runtimeResult.screenshotRef
        : null;
    const message =
      typeof runtimeResult.message === "string"
        ? runtimeResult.message
        : undefined;
    const stub =
      typeof runtimeResult.stub === "boolean" ? runtimeResult.stub : true;

    return {
      invocationId: input.invocationId,
      skillId: BROWSER_SKILL_ID,
      success: runtimeResult.success === true,
      data: {
        stub,
        action,
        ...(url ? { url } : {}),
        ...(browserState ? { browserState } : {}),
        result: {
          status,
          ...(message ? { message } : {}),
          screenshotRef,
        },
      },
      ...(runtimeResult.success === true
        ? {}
        : {
            error: {
              code: "BROWSER_RUNTIME_FAILED",
              message: message ?? "Browser runtime failed",
            },
          }),
    };
  }
}
